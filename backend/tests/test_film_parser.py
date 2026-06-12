from app.film_parser import parse_film_title


def test_parse_full_convention() -> None:
    meta = parse_film_title("El Padrino (1972) · Coppola — Escena del restaurante")
    assert meta.film_title == "El Padrino"
    assert meta.year == 1972
    assert meta.director == "Coppola"
    assert meta.scene_label == "Escena del restaurante"


def test_parse_film_year_only() -> None:
    meta = parse_film_title("Terminator (1984)")
    assert meta.film_title == "Terminator"
    assert meta.year == 1984
    assert meta.director is None
