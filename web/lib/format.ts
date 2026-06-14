import type { FeedItem } from "@/lib/api";

export type StatusTone = "ready" | "processing" | "quiet" | "failed" | "neutral";

interface StatusMeta {
  label: string;
  tone: StatusTone;
  /** CSS color var used by the ticket chip. */
  color: string;
}

const STATUS: Record<string, StatusMeta> = {
  ready: { label: "Lista", tone: "ready", color: "var(--color-st-ready)" },
  no_dialogue: {
    label: "Sin diálogo",
    tone: "quiet",
    color: "var(--color-st-quiet)",
  },
  indexing: {
    label: "Revelando",
    tone: "processing",
    color: "var(--color-st-processing)",
  },
  discovered: {
    label: "En cola",
    tone: "processing",
    color: "var(--color-st-processing)",
  },
  failed: { label: "Error", tone: "failed", color: "var(--color-st-failed)" },
  removed: { label: "Retirada", tone: "neutral", color: "var(--color-muted)" },
};

export function statusMeta(status: string): StatusMeta {
  return (
    STATUS[status] ?? {
      label: status,
      tone: "neutral",
      color: "var(--color-muted)",
    }
  );
}

/** Seconds → "m:ss" (or "h:mm:ss"). */
export function formatTimestamp(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${minutes}:${pad(seconds)}`;
}

/** ISO timestamp → "hace 2 días" (Spanish, relative). */
export function relativeTime(iso: string | null): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const diffSec = Math.round((then - Date.now()) / 1000);
  const abs = Math.abs(diffSec);

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];

  const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
  for (const [unit, secondsInUnit] of units) {
    if (abs >= secondsInUnit) {
      return rtf.format(Math.round(diffSec / secondsInUnit), unit);
    }
  }
  return "hace un momento";
}

/** "Dirigida por X · 1972" credit line, gracefully degrading. */
export function creditLine(item: FeedItem): string | null {
  const parts: string[] = [];
  if (item.director) parts.push(`Dirigida por ${item.director}`);
  if (item.year) parts.push(String(item.year));
  return parts.length ? parts.join(" · ") : null;
}

/** Best display title for a scene/hit. */
export function displayTitle(item: FeedItem): string {
  return item.film_title ?? item.title;
}
