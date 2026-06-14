import Image from "next/image";

import { PlayIcon, ReelMark } from "@/components/icons";

interface StillProps {
  src: string | null;
  alt: string;
  /** Timestamp badge (e.g. "0:42") rendered bottom-left. */
  badge?: string;
  /** Aspect ratio utility class. */
  ratioClass?: string;
  priority?: boolean;
}

/** Framed film still with sepia wash, hover ken-burns, and a play overlay. */
export function Still({
  src,
  alt,
  badge,
  ratioClass = "aspect-video",
  priority = false,
}: StillProps) {
  return (
    <div className={`still ${ratioClass} w-full`}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
          className="object-cover"
        />
      ) : (
        <div className="grid h-full w-full place-items-center bg-ink-2">
          <ReelMark className="h-10 w-10 text-line" />
        </div>
      )}

      {/* Play overlay (appears on card hover) */}
      <div className="pointer-events-none absolute inset-0 z-[2] grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <span className="grid h-12 w-12 place-items-center rounded-full border border-bone/40 bg-ink/55 text-bone backdrop-blur-sm">
          <PlayIcon className="ml-0.5 h-5 w-5" />
        </span>
      </div>

      {badge ? (
        <span className="absolute bottom-2 left-2 z-[2] rounded bg-ink/80 px-1.5 py-0.5 font-credit text-[0.58rem] text-gold-bright backdrop-blur-sm">
          {badge}
        </span>
      ) : null}
    </div>
  );
}
