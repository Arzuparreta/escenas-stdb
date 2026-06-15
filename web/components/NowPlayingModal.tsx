"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { embedUrl } from "@/lib/api";
import { CloseIcon, ExternalIcon, StarGlyph } from "@/components/icons";
import { formatTimestamp } from "@/lib/format";

export interface NowPlaying {
  youtubeId: string;
  startSec: number;
  youtubeUrl: string;
  title: string;
  credit: string | null;
  sceneLabel?: string | null;
  quote?: { before: string; match: string; after: string } | null;
}

interface NowPlayingModalProps {
  item: NowPlaying | null;
  onClose: () => void;
}

export function NowPlayingModal({ item, onClose }: NowPlayingModalProps) {
  const open = item !== null;
  // Retain the last item so the exit animation has content to render.
  const [shown, setShown] = useState<NowPlaying | null>(item);
  useEffect(() => {
    if (item) setShown(item);
  }, [item]);

  const data = shown;

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <AnimatePresence>
        {open && data ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm"
              />
            </Dialog.Overlay>

            <Dialog.Content
              asChild
              forceMount
              aria-describedby={undefined}
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 8 }}
                transition={{ type: "spring", stiffness: 280, damping: 28 }}
                className="fixed left-1/2 top-1/2 z-[81] flex w-[min(64rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 items-start justify-center gap-4"
              >
                <div className="relative w-full max-w-[58rem] overflow-hidden rounded-2xl border border-line bg-surface shadow-lift">
                  {/* Player */}
                  <div className="relative aspect-video w-full bg-black">
                    <iframe
                      key={data.youtubeId + data.startSec}
                      src={embedUrl(data.youtubeId, data.startSec)}
                      title={data.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 h-full w-full"
                    />
                  </div>

                  <Dialog.Close asChild>
                    <button
                      aria-label="Cerrar"
                      className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-line bg-ink/70 text-bone-dim backdrop-blur transition-colors hover:border-gold/50 hover:text-gold md:hidden"
                    >
                      <CloseIcon className="h-4 w-4" />
                    </button>
                  </Dialog.Close>

                  {/* Meta */}
                  <div className="space-y-4 p-6">
                    <div>
                      <Dialog.Title className="font-billing text-2xl leading-tight text-bone">
                        {data.title}
                      </Dialog.Title>
                      {data.credit ? (
                        <p className="mt-1 font-credit text-[0.62rem] text-gold-deep">
                          {data.credit}
                        </p>
                      ) : null}
                    </div>

                    {data.quote ? (
                      <blockquote className="border-l-2 border-gold/60 pl-4 text-lg leading-relaxed text-bone-dim">
                        <span className="text-muted">{data.quote.before} </span>
                        <span className="bg-gold/15 font-medium text-gold-bright">
                          {data.quote.match}
                        </span>
                        <span className="text-muted"> {data.quote.after}</span>
                      </blockquote>
                    ) : data.sceneLabel ? (
                      <p className="flex items-center gap-2 text-bone-dim">
                        <StarGlyph className="h-3 w-3 flex-none text-gold-deep" />
                        {data.sceneLabel}
                      </p>
                    ) : null}

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-4">
                      <span className="font-credit text-[0.58rem] text-faint">
                        {data.startSec > 0
                          ? `Entrada en ${formatTimestamp(data.startSec)}`
                          : "Desde el principio"}
                      </span>
                      <a
                        href={data.youtubeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 font-credit text-[0.6rem] text-bone-dim transition-colors hover:border-gold/50 hover:text-gold"
                      >
                        Ver en YouTube
                        <ExternalIcon className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </div>

                <Dialog.Close asChild>
                  <button
                    aria-label="Cerrar"
                    className="hidden h-11 w-11 flex-none place-items-center rounded-full border border-line bg-surface/90 text-bone-dim shadow-frame backdrop-blur transition-colors hover:border-gold/50 hover:text-gold md:grid"
                  >
                    <CloseIcon className="h-4 w-4" />
                  </button>
                </Dialog.Close>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
