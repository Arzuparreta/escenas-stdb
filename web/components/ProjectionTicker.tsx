"use client";

import { useEffect, useState } from "react";

import { getStatus, type StatusSummary } from "@/lib/api";

type Health = "loading" | "online" | "offline";

const POLL_MS = 30_000;

export function ProjectionTicker() {
  const [summary, setSummary] = useState<StatusSummary | null>(null);
  const [health, setHealth] = useState<Health>("loading");

  useEffect(() => {
    let alive = true;

    async function tick() {
      try {
        const data = await getStatus();
        if (!alive) return;
        setSummary(data);
        setHealth("online");
      } catch {
        if (!alive) return;
        setHealth("offline");
      }
    }

    tick();
    const timer = setInterval(tick, POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  const processing = summary
    ? summary.indexing + summary.discovered
    : 0;

  const lightColor =
    health === "offline"
      ? "var(--color-st-failed)"
      : "var(--color-st-ready)";

  return (
    <div
      className="flex items-center gap-2.5"
      aria-live="polite"
      aria-label="Estado del proyector"
    >
      <span
        className="proj-light"
        style={{ background: lightColor, color: lightColor }}
      />
      <div className="flex items-baseline gap-2 whitespace-nowrap">
        <span className="font-credit text-[0.6rem] text-muted">
          {health === "offline" ? "Sala cerrada" : "En proyección"}
        </span>
        {health === "online" && summary ? (
          <span className="hidden font-credit text-[0.6rem] text-faint sm:inline">
            <span className="text-gold-bright">{summary.ready}</span> listas
            {processing > 0 ? (
              <>
                {" · "}
                <span className="text-st-processing">{processing}</span> revelando
              </>
            ) : null}
          </span>
        ) : null}
      </div>
    </div>
  );
}
