import Link from "next/link";

import { ProjectionTicker } from "@/components/ProjectionTicker";
import { ReelMark } from "@/components/icons";

/** Sticky top bar styled like a cinema marquee / frontier sign. */
export function MarqueeHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line-soft bg-ink/72 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link
          href="/"
          className="group flex items-center gap-3 focus-visible:outline-none"
          aria-label="Escenas — inicio"
        >
          <span className="relative grid h-9 w-9 place-items-center rounded-full border border-line text-gold transition-colors duration-500 group-hover:border-gold/50">
            <ReelMark className="h-5 w-5 transition-transform duration-700 group-hover:rotate-90" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="wordmark text-xl text-bone">Escenas</span>
            <span className="font-credit text-[0.5rem] text-gold-deep">
              El Archivo
            </span>
          </span>
        </Link>

        <ProjectionTicker />
      </div>
    </header>
  );
}
