"use client";

import { motion } from "motion/react";

import { Still } from "@/components/Still";

interface SceneCardProps {
  title: string;
  credit: string | null;
  thumbnailUrl: string | null;
  /** Small credit-style label above the title (e.g. "Película"). */
  kicker?: string;
  sceneLabel?: string | null;
  relTime?: string | null;
  index: number;
  onPlay: () => void;
}

/** Lobby-card: a poster-style scene tile that opens the player. */
export function SceneCard({
  title,
  credit,
  thumbnailUrl,
  kicker,
  sceneLabel,
  relTime,
  index,
  onPlay,
}: SceneCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: Math.min(index * 0.045, 0.4),
        ease: [0.16, 1, 0.3, 1],
      }}
      className="card-frame still-zoom group relative flex flex-col overflow-hidden"
    >
      <Still src={thumbnailUrl} alt={title} priority={index < 3} />

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="mb-0.5 flex items-center justify-between gap-2">
          {kicker ? (
            <span className="font-credit text-[0.56rem] text-gold-deep">
              {kicker}
            </span>
          ) : (
            <span />
          )}
        </div>

        <h3 className="font-billing text-lg leading-snug text-bone">{title}</h3>

        {credit ? (
          <p className="font-credit text-[0.58rem] text-gold-deep">{credit}</p>
        ) : null}

        {sceneLabel ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted">
            {sceneLabel}
          </p>
        ) : null}

        {relTime ? (
          <p className="mt-auto pt-2 font-credit text-[0.54rem] text-faint">
            Añadida {relTime}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onPlay}
        aria-label={`Reproducir ${title}`}
        className="absolute inset-0 z-[3] rounded-[var(--radius-card)] focus-visible:outline-2 focus-visible:outline-gold"
      />
    </motion.article>
  );
}
