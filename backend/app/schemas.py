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


class SceneResponse(BaseModel):
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


class SearchHitResponse(BaseModel):
    video_id: str
    youtube_id: str
    title: str
    film_title: str | None = None
    director: str | None = None
    year: int | None = None
    matched_text: str
    context_before: str = ""
    context_after: str = ""
    start_sec: float
    thumbnail_url: str | None = None
    youtube_url: str


class SearchResponse(BaseModel):
    mode: str
    query: str
    results: list[SearchHitResponse] = Field(default_factory=list)
