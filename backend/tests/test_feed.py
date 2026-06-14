from __future__ import annotations

from datetime import UTC, datetime

import pytest
from stdbkit import StdbKit

from app.feed import build_feed


def _catalog(tmp_path) -> StdbKit:
    kit = StdbKit(tmp_path / "feed.db")
    indexed_at = datetime.now(UTC).isoformat()
    entries = [
        ("alpha", "El Padrino (1972) · Coppola — Restaurante", "Te haré una oferta que no podrás rechazar"),
        ("bravo", "Apocalypse Now (1979) · Coppola — Napalm", "Me gusta el olor del napalm por la mañana"),
        ("charlie", "Alien (1979) · Ridley Scott — Cena", "Algo se mueve dentro de la nave"),
    ]
    for youtube_id, title, text in entries:
        video_id = kit.database.upsert_discovered_video(
            youtube_id=youtube_id,
            url=f"https://youtube.com/watch?v={youtube_id}",
            title=title,
        )
        kit.database.update_video_subtitles(
            video_id,
            subtitle_lang="es",
            subtitle_source="test",
            segments=[
                (10, 12, "Contexto anterior"),
                (12, 15, text),
                (15, 18, "Contexto posterior"),
            ],
            indexed_at=indexed_at,
        )
    return kit


def test_discovery_is_stable_and_exhaustive(tmp_path) -> None:
    kit = _catalog(tmp_path)
    first = build_feed(kit, seed="stable", limit=2)
    second = build_feed(
        kit,
        seed="stable",
        cursor_value=first.next_cursor,
        limit=2,
    )
    replay = build_feed(kit, seed="stable", limit=2)

    ids = [item.video_id for item in first.items + second.items]
    assert ids == [item.video_id for item in replay.items] + [second.items[0].video_id]
    assert len(ids) == len(set(ids)) == 3
    assert second.next_cursor is None
    assert first.total == 3


def test_search_deduplicates_scene_and_uses_phrase_timestamp(tmp_path) -> None:
    kit = _catalog(tmp_path)
    response = build_feed(kit, query="Coppola", seed="search", limit=10)
    assert len(response.items) == 2
    assert len({item.video_id for item in response.items}) == 2

    phrase = build_feed(kit, query="napalm", seed="search", limit=10)
    assert len(phrase.items) == 1
    assert phrase.items[0].playback_start_sec == 10
    assert phrase.items[0].highlight is not None
    assert "napalm" in phrase.items[0].highlight.match.lower()
    assert phrase.items[0].youtube_url.endswith("&t=10s")


def test_cursor_cannot_be_reused_for_another_query(tmp_path) -> None:
    kit = _catalog(tmp_path)
    response = build_feed(kit, query="1979", seed="search", limit=1)
    assert response.next_cursor
    with pytest.raises(ValueError, match="query"):
        build_feed(
            kit,
            query="Coppola",
            cursor_value=response.next_cursor,
            limit=1,
        )
