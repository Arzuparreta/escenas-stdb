"use client";

import { FormEvent, useEffect, useState } from "react";

import {
  SearchHit,
  SearchMode,
  Scene,
  getStatus,
  listScenes,
  searchScenes,
} from "@/lib/api";

function statusLabel(status: string) {
  if (status === "ready") return "Lista";
  if (status === "no_dialogue") return "Sin diálogo";
  if (status === "indexing" || status === "discovered") return "Procesando…";
  if (status === "failed") return "Error";
  return status;
}

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("phrase");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [recent, setRecent] = useState<Scene[]>([]);
  const [statusText, setStatusText] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [status, scenes] = await Promise.all([getStatus(), listScenes()]);
        setStatusText(
          `${status.ready} listas · ${status.no_dialogue} sin diálogo · ${status.indexing + status.discovered} procesando · ${status.total} total`,
        );
        setRecent(scenes.slice(0, 12));
      } catch {
        setStatusText("API no disponible — ¿está corriendo el backend?");
      }
    }

    load();
    const timer = setInterval(load, 30_000);
    return () => clearInterval(timer);
  }, []);

  async function onSearch(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const hits = await searchScenes(query.trim(), mode);
      setResults(hits);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <section className="hero">
        <h1>Escenas</h1>
        <p>
          Tu tío añade escenas en YouTube. El sistema las indexa solo. Busca por
          frase, película o director.
        </p>
      </section>

      <form className="search-panel" onSubmit={onSearch}>
        <div className="search-row">
          <input
            className="search-input"
            placeholder='Prueba: "I&apos;ll be back" o Coppola'
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            className="mode-select"
            value={mode}
            onChange={(event) => setMode(event.target.value as SearchMode)}
          >
            <option value="phrase">Frase</option>
            <option value="film">Película</option>
            <option value="director">Director</option>
            <option value="all">Todo</option>
          </select>
          <button className="search-button" type="submit" disabled={loading}>
            {loading ? "Buscando…" : "Buscar"}
          </button>
        </div>
      </form>

      {statusText ? <div className="status-bar">{statusText}</div> : null}

      {searched ? (
        <section className="results">
          <h2 className="section-title">Resultados</h2>
          {results.length === 0 ? (
            <p className="empty">Sin coincidencias para esta búsqueda.</p>
          ) : (
            results.map((hit) => (
              <article className="card" key={`${hit.video_id}-${hit.start_sec}`}>
                {hit.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="thumb" src={hit.thumbnail_url} alt="" />
                ) : (
                  <div className="thumb" />
                )}
                <div>
                  <h3>{hit.film_title ?? hit.title}</h3>
                  <div className="meta">
                    {hit.director ? `${hit.director}` : null}
                    {hit.year ? ` · ${hit.year}` : null}
                  </div>
                  <p className="quote">&ldquo;{hit.matched_text}&rdquo;</p>
                  <a href={hit.youtube_url} target="_blank" rel="noreferrer">
                    Ver en YouTube{hit.start_sec > 0 ? ` (${Math.floor(hit.start_sec)}s)` : ""}
                  </a>
                </div>
              </article>
            ))
          )}
        </section>
      ) : null}

      <section className="recent">
        <h2 className="section-title">Escenas recientes</h2>
        {recent.length === 0 ? (
          <p className="empty">Aún no hay escenas indexadas.</p>
        ) : (
          recent.map((scene) => (
            <article className="card" key={scene.video_id}>
              {scene.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="thumb" src={scene.thumbnail_url} alt="" />
              ) : (
                <div className="thumb" />
              )}
              <div>
                <span className={`badge ${scene.status}`}>{statusLabel(scene.status)}</span>
                <h3>{scene.film_title ?? scene.title}</h3>
                <div className="meta">
                  {scene.director ? `${scene.director}` : null}
                  {scene.year ? ` · ${scene.year}` : null}
                </div>
                {scene.scene_label ? <p>{scene.scene_label}</p> : null}
                <a href={scene.youtube_url} target="_blank" rel="noreferrer">
                  Ver en YouTube
                </a>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
