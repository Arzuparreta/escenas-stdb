from __future__ import annotations

import logging
import threading
from contextlib import asynccontextmanager
from typing import Literal

import uvicorn
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from stdbkit import StdbKit
from stdbkit.types import VideoStatus
from stdbkit.webhooks.server import create_webhook_app

from app.config import settings
from app.film_parser import parse_film_title
from app.schemas import SceneResponse, SearchHitResponse, SearchResponse, StatusResponse

logger = logging.getLogger(__name__)
kit: StdbKit | None = None


def _run_webhook_server(stdbkit: StdbKit) -> None:
    webhook_app = create_webhook_app(stdbkit.database, secret=stdbkit.webhook_secret)
    config = uvicorn.Config(
        webhook_app,
        host=settings.webhook_host,
        port=settings.webhook_port,
        log_level="info",
    )
    server = uvicorn.Server(config)
    server.run()


@asynccontextmanager
async def lifespan(_: FastAPI):
    global kit
    settings.stdbkit_db_path.parent.mkdir(parents=True, exist_ok=True)
    kit = StdbKit(settings.stdbkit_db_path, webhook_secret=settings.stdbkit_secret)

    webhook_thread = threading.Thread(
        target=_run_webhook_server,
        args=(kit,),
        daemon=True,
        name="stdbkit-webhook",
    )
    webhook_thread.start()
    logger.info("Webhook server on http://%s:%s", settings.webhook_host, settings.webhook_port)

    if settings.youtube_playlist_url:
        kit.watch_playlist(settings.youtube_playlist_url)
        kit.start_relay_background(
            callback_url=f"http://{settings.webhook_host}:{settings.webhook_port}",
            interval_sec=settings.relay_interval_sec,
        )
        logger.info("Relay watching playlist every %ss", settings.relay_interval_sec)
    else:
        logger.warning("YOUTUBE_PLAYLIST_URL not set — relay will not run")

    yield

    if kit:
        kit.stop_relay()


app = FastAPI(title="escenas-stdb", lifespan=lifespan)
cors_kwargs: dict = {
    "allow_credentials": True,
    "allow_methods": ["*"],
    "allow_headers": ["*"],
}
if settings.cors_origins.strip() == "*":
    cors_kwargs["allow_origin_regex"] = r".*"
else:
    cors_kwargs["allow_origins"] = settings.cors_origin_list
app.add_middleware(CORSMiddleware, **cors_kwargs)


def _get_kit() -> StdbKit:
    if kit is None:
        raise RuntimeError("stdbKit not initialized")
    return kit


def _scene_from_video(video) -> SceneResponse:
    meta = parse_film_title(video.title)
    return SceneResponse(
        video_id=video.id,
        youtube_id=video.youtube_id,
        title=video.title,
        status=video.status.value,
        thumbnail_url=video.thumbnail_url,
        film_title=meta.film_title,
        director=meta.director,
        year=meta.year,
        scene_label=meta.scene_label,
        youtube_url=f"https://www.youtube.com/watch?v={video.youtube_id}",
        indexed_at=video.indexed_at,
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/status", response_model=StatusResponse)
def status() -> StatusResponse:
    summary = _get_kit().status()
    return StatusResponse(
        total=summary.total,
        ready=summary.ready,
        indexing=summary.indexing,
        discovered=summary.discovered,
        failed=summary.failed,
        no_dialogue=summary.no_dialogue,
        removed=summary.removed,
        watched_playlists=summary.watched_playlists,
    )


@app.get("/scenes", response_model=list[SceneResponse])
def list_scenes(
    status_filter: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=50, ge=1, le=200),
) -> list[SceneResponse]:
    video_status = VideoStatus(status_filter) if status_filter else None
    videos = _get_kit().list_videos(status=video_status, limit=limit)
    return [_scene_from_video(video) for video in videos]


@app.get("/search", response_model=SearchResponse)
def search(
    q: str = Query(min_length=1),
    mode: Literal["phrase", "film", "director", "all"] = "all",
    limit: int = Query(default=20, ge=1, le=100),
    exact: bool = False,
) -> SearchResponse:
    current_kit = _get_kit()
    hits: list[SearchHitResponse] = []
    query_lower = q.lower()

    if mode in ("phrase", "all"):
        for result in current_kit.search_phrase(q, limit=limit, exact=exact):
            meta = parse_film_title(result.title)
            hits.append(
                SearchHitResponse(
                    video_id=result.video_id,
                    youtube_id=result.youtube_id,
                    title=result.title,
                    film_title=meta.film_title,
                    director=meta.director,
                    year=meta.year,
                    matched_text=result.matched_text,
                    context_before=result.context_before,
                    context_after=result.context_after,
                    start_sec=result.start_sec,
                    thumbnail_url=result.thumbnail_url,
                    youtube_url=result.youtube_url_with_timestamp,
                )
            )

    if mode in ("film", "director", "all"):
        for video in current_kit.list_catalog_videos(limit=500):
            meta = parse_film_title(video.title)
            film_match = mode in ("film", "all") and meta.film_title and query_lower in meta.film_title.lower()
            director_match = (
                mode in ("director", "all") and meta.director and query_lower in meta.director.lower()
            )
            if not (film_match or director_match):
                continue
            if any(hit.video_id == video.id for hit in hits):
                continue
            hits.append(
                SearchHitResponse(
                    video_id=video.id,
                    youtube_id=video.youtube_id,
                    title=video.title,
                    film_title=meta.film_title,
                    director=meta.director,
                    year=meta.year,
                    matched_text=meta.scene_label or video.title,
                    start_sec=0,
                    thumbnail_url=video.thumbnail_url,
                    youtube_url=f"https://www.youtube.com/watch?v={video.youtube_id}",
                )
            )
            if len(hits) >= limit:
                break

    return SearchResponse(mode=mode, query=q, results=hits[:limit])
