"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  type Scene,
  type SearchHit,
  type SearchMode,
  getStatus,
  listScenes,
  searchScenes,
} from "@/lib/api";
import { CatalogGrid } from "@/components/CatalogGrid";
import { IntermissionError } from "@/components/IntermissionError";
import {
  NowPlayingModal,
  type NowPlaying,
} from "@/components/NowPlayingModal";
import { ResultsReel } from "@/components/ResultsReel";
import { SearchConsole } from "@/components/SearchConsole";
import { StarGlyph } from "@/components/icons";

type Health = "loading" | "online" | "offline";

export default function HomePage() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [health, setHealth] = useState<Health>("loading");
  const [retrying, setRetrying] = useState(false);

  const [results, setResults] = useState<SearchHit[]>([]);
  const [filter, setFilter] = useState<SearchMode>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [exact, setExact] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const bootstrap = useCallback(async () => {
    setCatalogLoading(true);
    try {
      const [, sceneList] = await Promise.all([getStatus(), listScenes(undefined, 12)]);
      setScenes(sceneList);
      setHealth("online");
    } catch (err) {
      console.error("Bootstrap failed:", err);
      setHealth("offline");
    } finally {
      setCatalogLoading(false);
      setRetrying(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
    const timer = setInterval(() => {
      // keep the catalog fresh without flipping the loading state
      listScenes(undefined, 12)
        .then((list) => {
          setScenes(list);
          setHealth("online");
        })
        .catch(() => undefined);
    }, 30_000);
    return () => clearInterval(timer);
  }, [bootstrap]);

  const runSearch = useCallback(
    async (query: string, mode: SearchMode, exactPhrase: boolean) => {
      setSearching(true);
      try {
        setResults(await searchScenes(query, mode, exactPhrase));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    },
    [],
  );

  // New search from the bar: smart by default (mode "all"), filter reset.
  const handleSearch = useCallback(
    (query: string, exactPhrase: boolean) => {
      setSearchQuery(query);
      setExact(exactPhrase);
      setFilter("all");
      setSearched(true);
      window.setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 80);
      runSearch(query, "all", exactPhrase);
    },
    [runSearch],
  );

  // Optional refinement: re-run the same query with a narrower type.
  const handleFilter = useCallback(
    (mode: SearchMode) => {
      setFilter(mode);
      runSearch(searchQuery, mode, exact);
    },
    [runSearch, searchQuery, exact],
  );

  const handleRetry = useCallback(() => {
    setRetrying(true);
    bootstrap();
  }, [bootstrap]);

  return (
    <main>
      {/* ───────────── Hero / the marquee ───────────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_70%_at_50%_-20%,rgba(189,95,53,0.22),transparent_60%),radial-gradient(80%_50%_at_70%_0%,rgba(230,180,80,0.14),transparent_55%)]"
        />
        <div className="relative mx-auto max-w-3xl px-5 pb-12 pt-16 text-center sm:pt-24">
          <p className="font-credit text-[0.6rem] text-gold-deep">
            Un archivo de cine · curado a mano
          </p>

          <h1 className="wordmark fx-flicker mt-4 text-6xl leading-none text-bone sm:text-8xl">
            Escenas
          </h1>

          <div className="mt-5 flex items-center justify-center gap-3 text-gold-deep">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-line" />
            <StarGlyph className="h-3 w-3" />
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-line" />
          </div>

          <p className="mx-auto mt-5 max-w-xl text-pretty leading-relaxed text-muted">
            Cada frase memorable, indexada y a un clic. Busca por lo que se dijo,
            por la película, o por quien empuñó la cámara.
          </p>

          <div className="mt-9">
            <SearchConsole onSearch={handleSearch} loading={searching} />
          </div>
        </div>

        <div className="film-perfs mx-auto h-3.5 max-w-5xl opacity-40" />
      </section>

      {/* ───────────── Content ───────────── */}
      {health === "offline" ? (
        <IntermissionError onRetry={handleRetry} retrying={retrying} />
      ) : (
        <>
          <div ref={resultsRef}>
            {searched ? (
              <ResultsReel
                results={results}
                mode={filter}
                query={searchQuery}
                loading={searching}
                onPlay={setNowPlaying}
                onFilterChange={handleFilter}
              />
            ) : null}
          </div>

          <CatalogGrid
            scenes={scenes}
            loading={catalogLoading}
            onPlay={setNowPlaying}
          />
        </>
      )}

      <NowPlayingModal item={nowPlaying} onClose={() => setNowPlaying(null)} />
    </main>
  );
}
