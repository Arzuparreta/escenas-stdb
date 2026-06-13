"use client";

import { motion } from "motion/react";

import type { SearchHit } from "@/lib/api";
import { Still } from "@/components/Still";
import { QuoteGlyph } from "@/components/icons";
import {
  creditLine,
  displayTitle,
  formatTimestamp,
} from "@/lib/format";

interface SubtitleCardProps {
  hit: SearchHit;
  index: number;
  onPlay: () => void;
}

/** A phrase hit shown as a subtitle / script excerpt next to its film still. */
export function SubtitleCard({ hit, index, onPlay }: SubtitleCardProps) {
  const title = displayTitle(hit);
  const credit = creditLine(hit);
  const badge = hit.start_sec > 0 ? formatTimestamp(hit.start_sec) : undefined;

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: Math.min(index * 0.05, 0.45),
        ease: [0.16, 1, 0.3, 1],
      }}
      className="card-frame still-zoom group relative grid grid-cols-1 overflow-hidden sm:grid-cols-[240px_1fr]"
    >
      <div className="border-b border-line-soft sm:border-b-0 sm:border-r">
        <Still
          src={hit.thumbnail_url}
          alt={title}
          badge={badge}
          priority={index < 2}
        />
      </div>

      <div className="flex flex-col gap-3 p-5">
        <QuoteGlyph className="h-5 w-5 text-gold/40" />

        <blockquote className="text-balance text-lg leading-relaxed text-bone-dim">
          {hit.context_before ? (
            <span className="text-muted">{hit.context_before} </span>
          ) : null}
          <span className="rounded bg-gold/15 px-0.5 font-medium text-gold-bright">
            {hit.matched_text}
          </span>
          {hit.context_after ? (
            <span className="text-muted"> {hit.context_after}</span>
          ) : null}
        </blockquote>

        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div>
            <h3 className="font-billing text-base leading-tight text-bone">
              {title}
            </h3>
            {credit ? (
              <p className="mt-0.5 font-credit text-[0.56rem] text-gold-deep">
                {credit}
              </p>
            ) : null}
          </div>
          <span className="font-credit text-[0.54rem] text-faint opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            Reproducir →
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onPlay}
        aria-label={`Reproducir escena de ${title}`}
        className="absolute inset-0 z-[3] rounded-[var(--radius-card)] focus-visible:outline-2 focus-visible:outline-gold"
      />
    </motion.article>
  );
}
