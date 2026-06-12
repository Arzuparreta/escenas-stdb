from __future__ import annotations

import re
from dataclasses import dataclass

# Convention: "El Padrino (1972) · Coppola — Escena del restaurante"
FULL_PATTERN = re.compile(
    r"^(?P<film>.+?)\s*\((?P<year>\d{4})\)\s*[·•|]\s*(?P<director>.+?)\s*[—–-]\s*(?P<scene>.+)$"
)
FILM_YEAR_PATTERN = re.compile(r"^(?P<film>.+?)\s*\((?P<year>\d{4})\)\s*(?P<rest>.*)$")


@dataclass(slots=True, frozen=True)
class FilmMetadata:
    film_title: str | None
    director: str | None
    year: int | None
    scene_label: str | None
    raw_title: str


def parse_film_title(raw_title: str) -> FilmMetadata:
    title = raw_title.strip()
    match = FULL_PATTERN.match(title)
    if match:
        return FilmMetadata(
            film_title=match.group("film").strip(),
            director=match.group("director").strip(),
            year=int(match.group("year")),
            scene_label=match.group("scene").strip(),
            raw_title=title,
        )

    partial = FILM_YEAR_PATTERN.match(title)
    if partial:
        rest = partial.group("rest").strip(" ·•|-—–")
        return FilmMetadata(
            film_title=partial.group("film").strip(),
            director=None,
            year=int(partial.group("year")),
            scene_label=rest or None,
            raw_title=title,
        )

    return FilmMetadata(
        film_title=title or None,
        director=None,
        year=None,
        scene_label=None,
        raw_title=title,
    )
