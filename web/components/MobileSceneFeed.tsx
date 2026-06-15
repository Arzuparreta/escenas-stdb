"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { ExternalIcon, PlayIcon, QuoteGlyph } from "@/components/icons";
import { embedUrl, type FeedItem } from "@/lib/api";
import { creditLine, displayTitle } from "@/lib/format";

interface MobileSceneFeedProps {
  items: FeedItem[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onNearEnd: () => void;
  loading: boolean;
  query: string;
}

function playerCommand(
  frame: HTMLIFrameElement | null,
  command:
    | "playVideo"
    | "pauseVideo"
    | "mute"
    | "unMute"
    | "loadVideoById"
    | "cueVideoById",
  args: unknown[] = [],
) {
  frame?.contentWindow?.postMessage(
    JSON.stringify({ event: "command", func: command, args }),
    "*",
  );
}

function sceneKey(item: FeedItem) {
  return `${item.youtube_id}:${item.playback_start_sec}`;
}

function loadScene(
  frame: HTMLIFrameElement | null,
  item: FeedItem,
  soundOn: boolean,
  autoplay: boolean,
) {
  playerCommand(frame, soundOn ? "unMute" : "mute");
  playerCommand(
    frame,
    autoplay ? "loadVideoById" : "cueVideoById",
    [{ videoId: item.youtube_id, startSeconds: item.playback_start_sec }],
  );
}

function syncPlayer(
  frame: HTMLIFrameElement | null,
  soundOn: boolean,
  autoplay: boolean,
) {
  if (!autoplay) {
    playerCommand(frame, soundOn ? "unMute" : "mute");
    return;
  }

  // Mobile browsers only allow reliable autoplay while muted. Start the new
  // iframe muted, then restore the user's sound preference once play is queued.
  playerCommand(frame, "mute");
  playerCommand(frame, "playVideo");
  if (soundOn) playerCommand(frame, "unMute");
}

export function MobileSceneFeed({
  items,
  activeIndex,
  onActiveIndexChange,
  onNearEnd,
  loading,
  query,
}: MobileSceneFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef(new Map<number, HTMLElement>());
  const playerSlotRefs = useRef(new Map<number, HTMLDivElement>());
  const playerLayerRef = useRef<HTMLDivElement>(null);
  const activeFrameRef = useRef<HTMLIFrameElement | null>(null);
  const activeItemRef = useRef<FeedItem | null>(null);
  const loadedSceneKeyRef = useRef<string | null>(null);
  const playerReadyRef = useRef(false);
  const [initialPlayerItem, setInitialPlayerItem] = useState<FeedItem | null>(
    null,
  );
  const [soundOn, setSoundOn] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  activeItemRef.current = items[activeIndex] ?? null;

  useEffect(() => {
    if (!initialPlayerItem && activeItemRef.current) {
      setInitialPlayerItem(activeItemRef.current);
    }
  }, [activeIndex, initialPlayerItem, items]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const index = Number((visible.target as HTMLElement).dataset.index);
        if (Number.isFinite(index)) onActiveIndexChange(index);
      },
      { root, threshold: [0.55, 0.7, 0.85] },
    );
    cardRefs.current.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [items.length, onActiveIndexChange]);

  useEffect(() => {
    if (activeIndex >= items.length - 3 && !loading) onNearEnd();
  }, [activeIndex, items.length, loading, onNearEnd]);

  useEffect(() => {
    const root = containerRef.current;
    const element = cardRefs.current.get(activeIndex);
    if (!root || !element) return;
    root.scrollTo({ top: element.offsetTop, behavior: "auto" });
  }, [activeIndex, items.length, query]);

  useLayoutEffect(() => {
    const root = containerRef.current;
    const slot = playerSlotRefs.current.get(activeIndex);
    const layer = playerLayerRef.current;
    if (!root || !slot || !layer) {
      if (layer) layer.style.display = "none";
      return;
    }

    const positionPlayer = () => {
      const rootRect = root.getBoundingClientRect();
      const slotRect = slot.getBoundingClientRect();
      layer.style.display = "block";
      layer.style.top = `${slotRect.top - rootRect.top + root.scrollTop}px`;
      layer.style.left = `${slotRect.left - rootRect.left + root.scrollLeft}px`;
      layer.style.width = `${slotRect.width}px`;
      layer.style.height = `${slotRect.height}px`;
    };

    positionPlayer();
    const observer = new ResizeObserver(positionPlayer);
    observer.observe(slot);
    window.addEventListener("resize", positionPlayer);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", positionPlayer);
    };
  }, [activeIndex, initialPlayerItem, items.length, query]);

  useEffect(() => {
    const frame = activeFrameRef.current;
    const item = activeItemRef.current;
    if (!frame || !item || !playerReadyRef.current) return;

    const key = sceneKey(item);
    if (loadedSceneKeyRef.current === key) {
      syncPlayer(frame, soundOn, !reducedMotion);
      return;
    }

    loadedSceneKeyRef.current = key;
    loadScene(frame, item, soundOn, !reducedMotion);
  }, [activeIndex, items, reducedMotion, soundOn]);

  useEffect(() => {
    function onPlayerMessage(event: MessageEvent) {
      const frame = activeFrameRef.current;
      if (!frame || event.source !== frame.contentWindow) return;
      try {
        const message =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (message?.event !== "onReady") return;
        playerReadyRef.current = true;
        const item = activeItemRef.current;
        if (!item) return;
        const key = sceneKey(item);
        if (loadedSceneKeyRef.current === key) {
          syncPlayer(frame, soundOn, !reducedMotion);
        } else {
          loadedSceneKeyRef.current = key;
          loadScene(frame, item, soundOn, !reducedMotion);
        }
      } catch {
        // Ignore unrelated postMessage traffic.
      }
    }
    window.addEventListener("message", onPlayerMessage);
    return () => window.removeEventListener("message", onPlayerMessage);
  }, [reducedMotion, soundOn]);

  function handlePlayerLoad(
    frame: HTMLIFrameElement,
    initialItem: FeedItem,
  ) {
    activeFrameRef.current = frame;
    playerReadyRef.current = false;
    loadedSceneKeyRef.current = sceneKey(initialItem);
    frame.contentWindow?.postMessage(
      JSON.stringify({ event: "listening", id: frame.id }),
      "*",
    );
    syncPlayer(frame, soundOn, !reducedMotion);
    window.setTimeout(
      () => {
        if (frame === activeFrameRef.current) {
          syncPlayer(frame, soundOn, !reducedMotion);
        }
      },
      250,
    );
  }

  function toggleSound() {
    const nextSoundOn = !soundOn;
    playerCommand(activeFrameRef.current, nextSoundOn ? "unMute" : "mute");
    setSoundOn(nextSoundOn);
  }

  if (!loading && items.length === 0) {
    return (
      <div className="grid min-h-dvh place-items-center px-7 text-center md:hidden">
        <div>
          <p className="font-billing text-2xl text-bone">Sin escenas</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {query
              ? `No encontramos escenas para «${query}».`
              : "El archivo todavía no tiene escenas reproducibles."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mobile-scene-feed relative h-dvh snap-y snap-mandatory overflow-y-auto overscroll-y-contain md:hidden"
    >
      {initialPlayerItem ? (
        <div
          ref={playerLayerRef}
          className="pointer-events-auto absolute z-20 hidden overflow-hidden rounded-2xl bg-black"
        >
          <iframe
            id="mobile-player"
            src={embedUrl(
              initialPlayerItem.youtube_id,
              initialPlayerItem.playback_start_sec,
              {
                autoplay: !reducedMotion,
                muted: true,
                inline: true,
              },
            )}
            onLoad={(event) =>
              handlePlayerLoad(event.currentTarget, initialPlayerItem)
            }
            title={
              activeItemRef.current
                ? displayTitle(activeItemRef.current)
                : displayTitle(initialPlayerItem)
            }
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      ) : null}
      {items.map((item, index) => (
        <article
          key={`${item.video_id}-${item.playback_start_sec}-${index}`}
          ref={(element) => {
            if (element) cardRefs.current.set(index, element);
            else cardRefs.current.delete(index);
          }}
          data-index={index}
          className="relative flex h-dvh snap-start snap-always flex-col justify-center overflow-hidden bg-black px-4 pb-8 pt-24"
        >
          {item.thumbnail_url ? (
            <div
              aria-hidden="true"
              className="absolute inset-0 scale-110 bg-cover bg-center opacity-25 blur-3xl"
              style={{ backgroundImage: `url("${item.thumbnail_url}")` }}
            />
          ) : null}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,10,7,.8),rgba(12,10,7,.18)_32%,rgba(12,10,7,.3)_65%,rgba(12,10,7,.96))]" />

          <div
            ref={(element) => {
              if (element) playerSlotRefs.current.set(index, element);
              else playerSlotRefs.current.delete(index);
            }}
            className="relative overflow-hidden rounded-2xl border border-bone/10 bg-black shadow-lift"
          >
            <div className="aspect-video">
              {item.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.thumbnail_url}
                  alt=""
                  className="h-full w-full object-cover opacity-75"
                />
              ) : (
                <div className="grid h-full place-items-center text-faint">
                  <PlayIcon className="h-10 w-10" />
                </div>
              )}
            </div>
          </div>

          <div className="relative mt-5 space-y-3 px-1">
            {item.highlight ? (
              <div className="flex gap-2.5">
                <QuoteGlyph className="mt-1 h-4 w-4 flex-none text-gold" />
                <blockquote className="line-clamp-3 text-base leading-relaxed text-bone">
                  <span className="text-muted">{item.highlight.before} </span>
                  <span className="font-medium text-gold-bright">
                    {item.highlight.match}
                  </span>
                  <span className="text-muted"> {item.highlight.after}</span>
                </blockquote>
              </div>
            ) : item.scene_label ? (
              <p className="line-clamp-2 text-sm leading-relaxed text-muted">
                {item.scene_label}
              </p>
            ) : null}

            <div>
              <h2 className="font-billing text-2xl leading-tight text-bone">
                {displayTitle(item)}
              </h2>
              {creditLine(item) ? (
                <p className="mt-1 font-credit text-[0.57rem] text-gold-deep">
                  {creditLine(item)}
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={toggleSound}
                className="rounded-full border border-line bg-ink/70 px-4 py-2 font-credit text-[0.55rem] text-bone backdrop-blur"
              >
                {soundOn ? "Silenciar" : "Activar sonido"}
              </button>
              <a
                href={item.youtube_url}
                target="_blank"
                rel="noreferrer"
                aria-label="Ver en YouTube"
                className="grid h-10 w-10 place-items-center rounded-full border border-line bg-ink/70 text-bone backdrop-blur"
              >
                <ExternalIcon className="h-4 w-4" />
              </a>
            </div>
          </div>
        </article>
      ))}
      {loading ? (
        <div className="grid h-dvh snap-start place-items-center bg-ink">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-gold" />
        </div>
      ) : null}
    </div>
  );
}
