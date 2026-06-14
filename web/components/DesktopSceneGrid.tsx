"use client";

import { useEffect, useRef } from "react";

import type { FeedItem } from "@/lib/api";
import type { NowPlaying } from "@/components/NowPlayingModal";
import { SceneCard } from "@/components/SceneCard";
import { SectionTitle } from "@/components/SectionTitle";
import { creditLine, displayTitle, relativeTime } from "@/lib/format";

interface DesktopSceneGridProps {
  items: FeedItem[];
  loading: boolean;
  hasMore: boolean;
  total: number;
  query: string;
  onLoadMore: () => void;
  onPlay: (item: NowPlaying) => void;
}

export function DesktopSceneGrid({
  items,
  loading,
  hasMore,
  total,
  query,
  onLoadMore,
  onPlay,
}: DesktopSceneGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && onLoadMore(),
      { rootMargin: "500px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);

  return (
    <section className="desktop-scene-grid mx-auto mt-20 hidden max-w-6xl px-5 md:block">
      <SectionTitle
        title={query ? "Resultados" : "Explora el archivo"}
        meta={
          <span className="font-credit text-[0.58rem] text-faint">
            {query ? `${total} escenas · «${query}»` : `${total} escenas`}
          </span>
        }
      />

      {!loading && items.length === 0 ? (
        <p className="rounded-card border border-dashed border-line py-16 text-center text-muted">
          No encontramos escenas{query ? ` para «${query}»` : ""}.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-3">
          {items.map((item, index) => (
            <SceneCard
              key={`${item.video_id}-${item.playback_start_sec}`}
              title={displayTitle(item)}
              credit={creditLine(item)}
              thumbnailUrl={item.thumbnail_url}
              kicker={item.highlight ? "Coincidencia" : undefined}
              sceneLabel={item.highlight?.match ?? item.scene_label}
              relTime={!query ? relativeTime(item.indexed_at) : null}
              index={index}
              onPlay={() =>
                onPlay({
                  youtubeId: item.youtube_id,
                  startSec: item.playback_start_sec,
                  youtubeUrl: item.youtube_url,
                  title: displayTitle(item),
                  credit: creditLine(item),
                  sceneLabel: item.highlight ? null : item.scene_label,
                  quote: item.highlight,
                })
              }
            />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="grid min-h-32 place-items-center">
        {loading ? (
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-gold" />
        ) : !hasMore && items.length > 0 ? (
          <span className="font-credit text-[0.55rem] text-faint">
            Fin del archivo
          </span>
        ) : null}
      </div>
    </section>
  );
}
