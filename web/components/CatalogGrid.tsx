"use client";

import { useState } from "react";

import type { Scene } from "@/lib/api";
import type { NowPlaying } from "@/components/NowPlayingModal";
import { FilterChips } from "@/components/FilterChips";
import { SceneCard } from "@/components/SceneCard";
import { SectionTitle } from "@/components/SectionTitle";
import { creditLine, displayTitle, relativeTime } from "@/lib/format";

const FILTERS = [
  { value: "all", label: "Todas" },
  { value: "ready", label: "Listas" },
  { value: "processing", label: "Revelando" },
  { value: "no_dialogue", label: "Sin diálogo" },
];

interface CatalogGridProps {
  scenes: Scene[];
  loading: boolean;
  onPlay: (item: NowPlaying) => void;
}

function matchesFilter(scene: Scene, filter: string): boolean {
  if (filter === "all") return true;
  if (filter === "processing")
    return scene.status === "indexing" || scene.status === "discovered";
  return scene.status === filter;
}

function toNowPlaying(scene: Scene): NowPlaying {
  return {
    youtubeId: scene.youtube_id,
    startSec: 0,
    youtubeUrl: scene.youtube_url,
    title: displayTitle(scene),
    credit: creditLine(scene),
    sceneLabel: scene.scene_label,
    quote: null,
  };
}

export function CatalogGrid({ scenes, loading, onPlay }: CatalogGridProps) {
  const [filter, setFilter] = useState("all");
  const visible = scenes.filter((scene) => matchesFilter(scene, filter));

  return (
    <section className="mx-auto mt-20 max-w-6xl px-5">
      <SectionTitle
        title="En proyección"
        meta={
          <FilterChips
            options={FILTERS}
            value={filter}
            onChange={setFilter}
            ariaLabel="Filtrar cartelera por estado"
          />
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="rounded-card border border-dashed border-line py-14 text-center text-muted">
          {scenes.length === 0
            ? "Aún no hay escenas en el archivo. Tu tío todavía no ha proyectado nada."
            : "Nada en esta sala por ahora."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((scene, index) => (
            <SceneCard
              key={scene.video_id}
              title={displayTitle(scene)}
              credit={creditLine(scene)}
              thumbnailUrl={scene.thumbnail_url}
              status={scene.status}
              sceneLabel={scene.scene_label}
              relTime={relativeTime(scene.indexed_at)}
              index={index}
              onPlay={() => onPlay(toNowPlaying(scene))}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function SkeletonCard() {
  return (
    <div className="card-frame overflow-hidden">
      <div className="skeleton aspect-video w-full" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-4 w-1/3 rounded" />
        <div className="skeleton h-5 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
      </div>
    </div>
  );
}
