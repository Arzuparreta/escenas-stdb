"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DesktopSceneGrid } from "@/components/DesktopSceneGrid";
import { FeedSearch } from "@/components/FeedSearch";
import { IntermissionError } from "@/components/IntermissionError";
import { MobileSceneFeed } from "@/components/MobileSceneFeed";
import {
  NowPlayingModal,
  type NowPlaying,
} from "@/components/NowPlayingModal";
import { StarGlyph } from "@/components/icons";
import { getFeed, type FeedItem } from "@/lib/api";

interface FeedState {
  items: FeedItem[];
  seed: string | null;
  cursor: string | null;
  total: number;
  loading: boolean;
  error: boolean;
}

const EMPTY_FEED: FeedState = {
  items: [],
  seed: null,
  cursor: null,
  total: 0,
  loading: false,
  error: false,
};

const SESSION_KEY = "escenas-discovery-session";

function parseQuery(raw: string): { query: string; exact: boolean } {
  const trimmed = raw.trim();
  const quoted = trimmed.match(/^"([^"]+)"$/);
  if (quoted) return { query: quoted[1].trim(), exact: true };
  return { query: trimmed, exact: false };
}

export default function HomePage() {
  const [discover, setDiscover] = useState<FeedState>({
    ...EMPTY_FEED,
    loading: true,
  });
  const [search, setSearch] = useState<FeedState>(EMPTY_FEED);
  const [queryInput, setQueryInput] = useState("");
  const [searchSpec, setSearchSpec] = useState({ query: "", exact: false });
  const [discoverIndex, setDiscoverIndex] = useState(0);
  const [discoverCycleStart, setDiscoverCycleStart] = useState(0);
  const [searchIndex, setSearchIndex] = useState(0);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const searchRequestRef = useRef<AbortController | null>(null);
  const loadMoreRef = useRef(false);

  const searching = searchSpec.query.length >= 2;
  const current = searching ? search : discover;
  const activeIndex = searching ? searchIndex : discoverIndex;

  const loadDiscovery = useCallback(async () => {
    let requestSeed: string | undefined;
    let targetIndex = 0;

    setDiscover({ ...EMPTY_FEED, loading: true });
    setDiscoverIndex(0);
    setDiscoverCycleStart(0);
    const stored = window.sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        const session = JSON.parse(stored) as { seed?: string; index?: number };
        requestSeed = session.seed;
        targetIndex = Math.max(0, session.index ?? 0);
      } catch {
        window.sessionStorage.removeItem(SESSION_KEY);
      }
    }

    try {
      let response = await getFeed({
        seed: requestSeed,
        limit: 12,
      });
      let loaded = response.items;
      let cursor = response.next_cursor;

      while (targetIndex >= loaded.length && cursor) {
        response = await getFeed({
          seed: response.seed,
          cursor,
          limit: 12,
        });
        loaded = loaded.concat(response.items);
        cursor = response.next_cursor;
      }

      setDiscover({
        items: loaded,
        seed: response.seed,
        cursor,
        total: response.total,
        loading: false,
        error: false,
      });
      setDiscoverIndex(Math.max(0, Math.min(targetIndex, loaded.length - 1)));
    } catch {
      setDiscover((state) => ({ ...state, loading: false, error: true }));
    }
  }, []);

  useEffect(() => {
    loadDiscovery();
  }, [loadDiscovery]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const parsed = parseQuery(queryInput);
      setSearchSpec(
        parsed.query.length >= 2 ? parsed : { query: "", exact: false },
      );
    }, 250);
    return () => window.clearTimeout(timer);
  }, [queryInput]);

  useEffect(() => {
    searchRequestRef.current?.abort();
    if (!searchSpec.query) {
      setSearch(EMPTY_FEED);
      setSearchIndex(0);
      return;
    }

    const controller = new AbortController();
    searchRequestRef.current = controller;
    setSearch({ ...EMPTY_FEED, loading: true });
    setSearchIndex(0);

    getFeed({
      query: searchSpec.query,
      exact: searchSpec.exact,
      limit: 12,
      signal: controller.signal,
    })
      .then((response) => {
        setSearch({
          items: response.items,
          seed: response.seed,
          cursor: response.next_cursor,
          total: response.total,
          loading: false,
          error: false,
        });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSearch((state) => ({ ...state, loading: false, error: true }));
      });

    return () => controller.abort();
  }, [searchSpec]);

  useEffect(() => {
    if (!discover.seed) return;
    if (discoverCycleStart > 0 && discoverIndex < discoverCycleStart) return;
    window.sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        seed: discover.seed,
        index: Math.max(0, discoverIndex - discoverCycleStart),
      }),
    );
  }, [discover.seed, discoverCycleStart, discoverIndex]);

  const loadMore = useCallback(async () => {
    const state = searching ? search : discover;
    if (loadMoreRef.current || state.loading || !state.seed) return;
    if (searching && !state.cursor) return;
    loadMoreRef.current = true;

    const update = searching ? setSearch : setDiscover;
    update((currentState) => ({
      ...currentState,
      loading: true,
      error: false,
    }));
    try {
      if (!searching && !state.cursor) {
        const response = await getFeed({ limit: 12 });
        const recentIds = new Set(
          state.items.slice(-5).map((item) => item.video_id),
        );
        const nextItems = response.items.filter(
          (item) => !recentIds.has(item.video_id),
        );
        setDiscover((currentState) => ({
          ...currentState,
          items: currentState.items.concat(nextItems),
          seed: response.seed,
          cursor: response.next_cursor,
          total: response.total,
          loading: false,
        }));
        setDiscoverCycleStart(state.items.length);
        return;
      }

      const response = await getFeed({
        query: searching ? searchSpec.query : "",
        exact: searching ? searchSpec.exact : false,
        seed: state.seed,
        cursor: state.cursor,
        limit: 12,
      });
      update((currentState) => ({
        ...currentState,
        items: currentState.items.concat(response.items),
        cursor: response.next_cursor,
        total: response.total,
        loading: false,
      }));
    } catch {
      update((currentState) => ({
        ...currentState,
        loading: false,
        error: true,
      }));
    } finally {
      loadMoreRef.current = false;
    }
  }, [discover, search, searchSpec, searching]);

  const handleActiveIndex = useCallback(
    (index: number) => {
      if (searching) setSearchIndex(index);
      else setDiscoverIndex(index);
    },
    [searching],
  );

  const handleRetry = useCallback(() => {
    if (searching) {
      setSearchSpec({ ...searchSpec });
    } else {
      loadDiscovery();
    }
  }, [loadDiscovery, searchSpec, searching]);

  const searchStatus = useMemo(
    () => search.loading && search.items.length === 0,
    [search.items.length, search.loading],
  );

  return (
    <main>
      <div className="fixed left-4 right-4 top-4 z-50 md:hidden">
        <FeedSearch
          value={queryInput}
          onChange={setQueryInput}
          searching={searchStatus}
          compact
        />
      </div>

      {current.error && current.items.length === 0 ? (
        <div className="grid min-h-dvh place-items-center md:hidden">
          <IntermissionError
            onRetry={handleRetry}
            retrying={current.loading}
          />
        </div>
      ) : (
        <MobileSceneFeed
          items={current.items}
          activeIndex={Math.max(0, activeIndex)}
          onActiveIndexChange={handleActiveIndex}
          onNearEnd={loadMore}
          loading={current.loading}
          query={searchSpec.query}
        />
      )}

      <section className="desktop-scene-hero relative hidden overflow-hidden md:block">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_70%_at_50%_-20%,rgba(189,95,53,0.22),transparent_60%),radial-gradient(80%_50%_at_70%_0%,rgba(230,180,80,0.14),transparent_55%)]"
        />
        <div className="relative mx-auto max-w-3xl px-5 pb-12 pt-20 text-center">
          <p className="font-credit text-[0.6rem] text-gold-deep">
            Un archivo de cine · curado a mano
          </p>
          <h1 className="wordmark fx-flicker mt-4 text-8xl leading-none text-bone">
            Escenas
          </h1>
          <div className="mt-5 flex items-center justify-center gap-3 text-gold-deep">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-line" />
            <StarGlyph className="h-3 w-3" />
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-line" />
          </div>
          <p className="mx-auto mt-5 max-w-xl text-pretty leading-relaxed text-muted">
            Busca una frase o recorre el archivo escena a escena. Todo vive en
            el mismo lugar.
          </p>
          <div className="mt-9">
            <FeedSearch
              value={queryInput}
              onChange={setQueryInput}
              searching={searchStatus}
            />
          </div>
        </div>
        <div className="film-perfs mx-auto h-3.5 max-w-5xl opacity-40" />
      </section>

      {current.error && current.items.length === 0 ? (
        <div className="hidden md:block">
          <IntermissionError
            onRetry={handleRetry}
            retrying={current.loading}
          />
        </div>
      ) : (
        <DesktopSceneGrid
          items={current.items}
          loading={current.loading}
          hasMore={Boolean(current.cursor)}
          total={current.total}
          query={searchSpec.query}
          onLoadMore={loadMore}
          onPlay={setNowPlaying}
        />
      )}

      <NowPlayingModal item={nowPlaying} onClose={() => setNowPlaying(null)} />
    </main>
  );
}
