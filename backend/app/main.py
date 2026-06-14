from __future__ import annotations

import logging
import threading
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from stdbkit import StdbKit
from stdbkit.webhooks.server import create_webhook_app

from app.config import settings
from app.feed import build_feed
from app.schemas import FeedResponse, StatusResponse

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


@app.get("/feed", response_model=FeedResponse)
def feed(
    q: str = "",
    seed: str | None = None,
    cursor: str | None = None,
    limit: int = Query(default=12, ge=1, le=50),
    exact: bool = False,
) -> FeedResponse:
    try:
        return build_feed(
            _get_kit(),
            query=q,
            seed=seed,
            cursor_value=cursor,
            limit=limit,
            exact=exact,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
