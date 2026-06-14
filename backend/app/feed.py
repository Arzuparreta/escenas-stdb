from __future__ import annotations

import base64
import hashlib
import json
import secrets
from dataclasses import dataclass
from typing import Literal

from stdbkit import StdbKit
from stdbkit.types import PhraseSearchResult, VideoRecord

from app.film_parser import FilmMetadata, parse_film_title
from app.schemas import FeedHighlight, FeedItemResponse, FeedResponse

FeedMode = Literal["discover", "search"]


@dataclass(slots=True, frozen=True)
class Cursor:
    mode: FeedMode
    seed: str
    offset: int
    query: str
    exact: bool


@dataclass(slots=True)
class RankedItem:
    video: VideoRecord
    metadata: FilmMetadata
    score: int
    start_sec: float = 0
    highlight: FeedHighlight | None = None


def _encode_cursor(cursor: Cursor) -> str:
    payload = {
        "v": 1,
        "m": cursor.mode,
        "s": cursor.seed,
        "o": cursor.offset,
        "q": cursor.query,
        "e": cursor.exact,
    }
    raw = json.dumps(payload, separators=(",", ":"), ensure_ascii=True).encode()
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def _decode_cursor(value: str) -> Cursor:
    try:
        padded = value + "=" * (-len(value) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded).decode())
        mode = payload["m"]
        if payload.get("v") != 1 or mode not in ("discover", "search"):
            raise ValueError
        offset = int(payload["o"])
        if offset < 0:
            raise ValueError
        return Cursor(
            mode=mode,
            seed=str(payload["s"]),
            offset=offset,
            query=str(payload.get("q", "")),
            exact=bool(payload.get("e", False)),
        )
    except (KeyError, TypeError, ValueError, UnicodeError, json.JSONDecodeError) as exc:
        raise ValueError("Invalid feed cursor") from exc


def _stable_order(video: VideoRecord, seed: str) -> bytes:
    return hashlib.sha256(f"{seed}:{video.id}".encode()).digest()


def _youtube_thumbnail(youtube_id: str, existing_url: str | None) -> str:
    return existing_url or f"https://img.youtube.com/vi/{youtube_id}/hqdefault.jpg"


def _youtube_url(youtube_id: str, start_sec: float) -> str:
    start = max(0, int(start_sec))
    suffix = f"&t={start}s" if start else ""
    return f"https://www.youtube.com/watch?v={youtube_id}{suffix}"


def _to_response(item: RankedItem) -> FeedItemResponse:
    video = item.video
    metadata = item.metadata
    start_sec = max(0, item.start_sec - 2) if item.highlight else 0
    return FeedItemResponse(
        video_id=video.id,
        youtube_id=video.youtube_id,
        title=video.title,
        status=video.status.value,
        thumbnail_url=_youtube_thumbnail(video.youtube_id, video.thumbnail_url),
        film_title=metadata.film_title,
        director=metadata.director,
        year=metadata.year,
        scene_label=metadata.scene_label,
        youtube_url=_youtube_url(video.youtube_id, start_sec),
        indexed_at=video.indexed_at,
        playback_start_sec=start_sec,
        playback_end_sec=None,
        highlight=item.highlight,
    )


def _metadata_score(query: str, metadata: FilmMetadata, video: VideoRecord) -> int:
    query_lower = query.casefold()
    fields = (
        (metadata.film_title, 400, 700, 850),
        (metadata.director, 350, 680, 820),
        (metadata.scene_label, 300, 600, 750),
        (video.title, 250, 550, 700),
    )
    best = 0
    for value, contains_score, prefix_score, exact_score in fields:
        if not value:
            continue
        normalized = value.casefold()
        if normalized == query_lower:
            best = max(best, exact_score)
        elif normalized.startswith(query_lower):
            best = max(best, prefix_score)
        elif query_lower in normalized:
            best = max(best, contains_score)
    return best


def _rank_search(
    kit: StdbKit,
    videos: list[VideoRecord],
    query: str,
    exact: bool,
) -> list[RankedItem]:
    by_id = {video.id: video for video in videos}
    ranked: dict[str, RankedItem] = {}

    for video in videos:
        metadata = parse_film_title(video.title)
        score = _metadata_score(query, metadata, video)
        if score:
            ranked[video.id] = RankedItem(video=video, metadata=metadata, score=score)

    phrase_hits: list[PhraseSearchResult] = kit.search_phrase(
        query,
        limit=min(500, max(100, len(videos) * 5)),
        exact=exact,
    )
    for index, hit in enumerate(phrase_hits):
        video = by_id.get(hit.video_id)
        if video is None:
            continue
        phrase_score = (1000 if exact else 800) - min(index, 100)
        current = ranked.get(video.id)
        if current is not None and current.score >= phrase_score:
            continue
        ranked[video.id] = RankedItem(
            video=video,
            metadata=parse_film_title(video.title),
            score=phrase_score,
            start_sec=hit.start_sec,
            highlight=FeedHighlight(
                before=hit.context_before,
                match=hit.matched_text,
                after=hit.context_after,
            ),
        )

    return sorted(
        ranked.values(),
        key=lambda item: (-item.score, item.video.title.casefold(), item.video.id),
    )


def build_feed(
    kit: StdbKit,
    *,
    query: str = "",
    seed: str | None = None,
    cursor_value: str | None = None,
    limit: int = 12,
    exact: bool = False,
) -> FeedResponse:
    normalized_query = query.strip()
    mode: FeedMode = "search" if normalized_query else "discover"
    resolved_seed = seed or secrets.token_urlsafe(9)
    offset = 0

    if cursor_value:
        cursor = _decode_cursor(cursor_value)
        if cursor.mode != mode:
            raise ValueError("Cursor mode does not match request")
        if cursor.query != normalized_query or cursor.exact != exact:
            raise ValueError("Cursor query does not match request")
        if seed and cursor.seed != seed:
            raise ValueError("Cursor seed does not match request")
        resolved_seed = cursor.seed
        offset = cursor.offset

    videos = kit.list_catalog_videos(limit=500)
    if mode == "discover":
        ordered = [
            RankedItem(video=video, metadata=parse_film_title(video.title), score=0)
            for video in sorted(videos, key=lambda item: _stable_order(item, resolved_seed))
        ]
    else:
        ordered = _rank_search(kit, videos, normalized_query, exact)

    page = ordered[offset : offset + limit]
    next_offset = offset + len(page)
    next_cursor = None
    if next_offset < len(ordered):
        next_cursor = _encode_cursor(
            Cursor(
                mode=mode,
                seed=resolved_seed,
                offset=next_offset,
                query=normalized_query,
                exact=exact,
            )
        )

    return FeedResponse(
        mode=mode,
        seed=resolved_seed,
        items=[_to_response(item) for item in page],
        next_cursor=next_cursor,
        total=len(ordered),
    )
