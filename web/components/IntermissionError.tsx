"use client";

import { ReelMark, StarGlyph } from "@/components/icons";

interface IntermissionErrorProps {
  onRetry: () => void;
  retrying?: boolean;
}

/** Shown when the API can't be reached — styled as a cinema intermission slide. */
export function IntermissionError({ onRetry, retrying }: IntermissionErrorProps) {
  return (
    <div className="mx-auto mt-20 max-w-xl px-5">
      <div className="relative overflow-hidden rounded-card border border-line bg-gradient-to-b from-maroon/40 to-surface px-8 py-14 text-center">
        <div className="film-perfs absolute inset-x-0 top-0 h-3.5 opacity-60" />
        <div className="film-perfs absolute inset-x-0 bottom-0 h-3.5 opacity-60" />

        <div className="mb-5 flex items-center justify-center gap-3 text-gold-deep">
          <span className="h-px w-8 bg-line" />
          <StarGlyph className="h-3.5 w-3.5" />
          <span className="h-px w-8 bg-line" />
        </div>

        <ReelMark className="mx-auto h-12 w-12 text-gold/70" />

        <h2 className="mt-5 font-billing text-3xl text-bone">Intermedio</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          No se puede contactar con la sala de proyección. ¿Está el backend en
          marcha?
        </p>

        <button
          onClick={onRetry}
          disabled={retrying}
          className="mt-7 rounded-full bg-gradient-to-b from-gold-bright to-gold-deep px-6 py-2.5 font-credit text-[0.66rem] text-ink transition-all hover:brightness-110 disabled:opacity-50"
        >
          {retrying ? "Reintentando…" : "Reanudar sesión"}
        </button>
      </div>
    </div>
  );
}
