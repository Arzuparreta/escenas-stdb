from __future__ import annotations

from pydantic import BaseModel, Field


class StatusResponse(BaseModel):
    total: int
    ready: int
    indexing: int
    discovered: int
    failed: int
    no_dialogue: int
    removed: int
    watched_playlists: int


class FeedHighlight(BaseModel):
    before: str = ""
    match: str
    after: str = ""


class FeedItemResponse(BaseModel):
    video_id: str
    youtube_id: str
    title: str
    status: str
    thumbnail_url: str | None = None
    film_title: str | None = None
    director: str | None = None
    year: int | None = None
    scene_label: str | None = None
    youtube_url: str
    indexed_at: str | None = None
    playback_start_sec: float = 0
    playback_end_sec: float | None = None
    highlight: FeedHighlight | None = None


class FeedResponse(BaseModel):
    mode: str
    seed: str
    items: list[FeedItemResponse] = Field(default_factory=list)
    next_cursor: str | None = None
    total: int
