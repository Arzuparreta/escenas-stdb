"use client";

import type { SearchHit, SearchMode } from "@/lib/api";
import type { NowPlaying } from "@/components/NowPlayingModal";
import { FilterChips } from "@/components/FilterChips";
import { SceneCard } from "@/components/SceneCard";
import { SectionTitle } from "@/components/SectionTitle";
import { SubtitleCard } from "@/components/SubtitleCard";
import { ReelMark } from "@/components/icons";
import { creditLine, displayTitle } from "@/lib/format";

const FILTERS = [
  { value: "all", label: "Todo" },
  { value: "phrase", label: "Frases" },
  { value: "film", label: "Películas" },
  { value: "director", label: "Directores" },
];

interface ResultsReelProps {
  results: SearchHit[];
  mode: SearchMode;
  query: string;
  loading: boolean;
  onPlay: (item: NowPlaying) => void;
  /** Optional refinement: re-query with a narrower mode. */
  onFilterChange: (mode: SearchMode) => void;
}

function isPhraseHit(hit: SearchHit, mode: SearchMode): boolean {
  if (mode === "phrase") return true;
  if (mode === "film" || mode === "director") return false;
  // "all": phrase hits carry a timestamp and/or surrounding context.
  return (
    hit.start_sec > 0 || Boolean(hit.context_before || hit.context_after)
  );
}

function toNowPlaying(hit: SearchHit, asPhrase: boolean): NowPlaying {
  return {
    youtubeId: hit.youtube_id,
    startSec: hit.start_sec,
    youtubeUrl: hit.youtube_url,
    title: displayTitle(hit),
    credit: creditLine(hit),
    sceneLabel: asPhrase ? null : hit.matched_text,
    quote: asPhrase
      ? {
          before: hit.context_before,
          match: hit.matched_text,
          after: hit.context_after,
        }
      : null,
  };
}

export function ResultsReel({
  results,
  mode,
  query,
  loading,
  onPlay,
  onFilterChange,
}: ResultsReelProps) {
  return (
    <section className="mx-auto mt-16 max-w-5xl px-5">
      <SectionTitle
        title="El metraje"
        meta={
          !loading ? (
            <span className="font-credit text-[0.58rem] text-faint">
              {results.length} {results.length === 1 ? "toma" : "tomas"}
              {query ? <> · «{query}»</> : null}
            </span>
          ) : null
        }
      />

      <div className="mb-6 -mt-2">
        <FilterChips
          options={FILTERS}
          value={mode}
          onChange={(v) => onFilterChange(v as SearchMode)}
          ariaLabel="Afinar resultados por tipo"
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : results.length === 0 ? (
        <EmptyReel query={query} />
      ) : (
        <div className="space-y-4">
          {results.map((hit, index) => {
            const phrase = isPhraseHit(hit, mode);
            const key = `${hit.video_id}-${hit.start_sec}-${index}`;
            if (phrase) {
              return (
                <SubtitleCard
                  key={key}
                  hit={hit}
                  index={index}
                  onPlay={() => onPlay(toNowPlaying(hit, true))}
                />
              );
            }
            return (
              <div key={key} className="sm:max-w-md">
                <SceneCard
                  title={displayTitle(hit)}
                  credit={creditLine(hit)}
                  thumbnailUrl={hit.thumbnail_url}
                  kicker={mode === "director" ? "Director" : "Película"}
                  sceneLabel={hit.matched_text}
                  index={index}
                  onPlay={() => onPlay(toNowPlaying(hit, false))}
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function SkeletonRow() {
  return (
    <div className="card-frame grid grid-cols-1 overflow-hidden sm:grid-cols-[240px_1fr]">
      <div className="skeleton aspect-video w-full" />
      <div className="space-y-3 p-5">
        <div className="skeleton h-4 w-1/4 rounded" />
        <div className="skeleton h-5 w-full rounded" />
        <div className="skeleton h-5 w-4/5 rounded" />
        <div className="skeleton h-3 w-1/3 rounded" />
      </div>
    </div>
  );
}

function EmptyReel({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-card border border-dashed border-line py-16 text-center">
      <ReelMark className="h-12 w-12 text-line" />
      <div>
        <p className="font-billing text-xl text-bone-dim">
          Sin metraje en el archivo
        </p>
        <p className="mt-1 text-sm text-muted">
          No hay coincidencias{query ? <> para «{query}»</> : null}. Prueba con
          otra frase o cambia de modo.
        </p>
      </div>
    </div>
  );
}
