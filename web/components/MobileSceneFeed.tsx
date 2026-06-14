"use client";

import { useEffect, useId, useRef, useState } from "react";

import { ExternalIcon, PlayIcon, QuoteGlyph } from "@/components/icons";
import type { FeedItem } from "@/lib/api";
import { creditLine, displayTitle } from "@/lib/format";

interface MobileSceneFeedProps {
  items: FeedItem[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onNearEnd: () => void;
  loading: boolean;
  query: string;
}

interface YouTubePlayer {
  destroy: () => void;
  getCurrentTime: () => number;
  getPlayerState: () => number;
  mute: () => void;
  playVideo: () => void;
  unMute: () => void;
}

interface YouTubePlayerConstructor {
  new (
    elementId: string,
    options: {
      host: string;
      videoId: string;
      width: string;
      height: string;
      playerVars: Record<string, number | string>;
      events: {
        onReady: (event: { target: YouTubePlayer }) => void;
      };
    },
  ): YouTubePlayer;
}

type YouTubeWindow = Window & {
  YT?: { Player: YouTubePlayerConstructor };
  onYouTubeIframeAPIReady?: () => void;
};

let youtubeApiPromise: Promise<YouTubePlayerConstructor> | null = null;

function loadYouTubeApi(): Promise<YouTubePlayerConstructor> {
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve, reject) => {
    const youtubeWindow = window as YouTubeWindow;
    if (youtubeWindow.YT?.Player) {
      resolve(youtubeWindow.YT.Player);
      return;
    }

    const previousReady = youtubeWindow.onYouTubeIframeAPIReady;
    youtubeWindow.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      if (youtubeWindow.YT?.Player) resolve(youtubeWindow.YT.Player);
      else reject(new Error("YouTube iframe API loaded without YT.Player"));
    };

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]',
    );
    if (existingScript) return;

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load YouTube iframe API"));
    document.head.appendChild(script);
  });

  return youtubeApiPromise;
}

function MobileYouTubePlayer({
  youtubeId,
  startSec,
  title,
  soundOn,
  autoplay,
}: {
  youtubeId: string;
  startSec: number;
  title: string;
  soundOn: boolean;
  autoplay: boolean;
}) {
  const reactId = useId();
  const elementId = `mobile-youtube-${reactId.replaceAll(":", "")}`;
  const playerRef = useRef<YouTubePlayer | null>(null);
  const resumeSecRef = useRef(startSec);
  const shouldPlayRef = useRef(autoplay);
  const soundOnRef = useRef(soundOn);
  const [inline, setInline] = useState(true);

  useEffect(() => {
    soundOnRef.current = soundOn;
    const player = playerRef.current;
    if (!player) return;
    if (soundOn) player.unMute();
    else player.mute();
  }, [soundOn]);

  useEffect(() => {
    shouldPlayRef.current = autoplay;
  }, [autoplay]);

  useEffect(() => {
    const landscapeQuery = window.matchMedia("(orientation: landscape)");

    function handleOrientationChange() {
      const player = playerRef.current;
      if (player) {
        const currentTime = player.getCurrentTime();
        if (Number.isFinite(currentTime)) resumeSecRef.current = currentTime;
        shouldPlayRef.current = [1, 3].includes(player.getPlayerState());
      }
      setInline(!landscapeQuery.matches);
    }

    handleOrientationChange();
    landscapeQuery.addEventListener("change", handleOrientationChange);
    return () =>
      landscapeQuery.removeEventListener("change", handleOrientationChange);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let player: YouTubePlayer | null = null;

    loadYouTubeApi()
      .then((Player) => {
        if (cancelled) return;
        player = new Player(elementId, {
          host: "https://www.youtube-nocookie.com",
          videoId: youtubeId,
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: shouldPlayRef.current ? 1 : 0,
            controls: 1,
            enablejsapi: 1,
            modestbranding: 1,
            mute: 1,
            origin: window.location.origin,
            playsinline: inline ? 1 : 0,
            rel: 0,
            start: Math.max(0, Math.floor(resumeSecRef.current)),
          },
          events: {
            onReady: ({ target }) => {
              if (cancelled) return;
              playerRef.current = target;
              if (soundOnRef.current) target.unMute();
              else target.mute();
              if (shouldPlayRef.current) target.playVideo();
              const iframe = document.getElementById(elementId);
              iframe?.setAttribute("title", title);
              iframe?.setAttribute(
                "allow",
                "autoplay; encrypted-media; fullscreen; picture-in-picture",
              );
              iframe?.setAttribute("allowfullscreen", "");
            },
          },
        });
        playerRef.current = player;
      })
      .catch(() => {
        // Keep the player area empty if the external API cannot be loaded.
      });

    return () => {
      cancelled = true;
      if (playerRef.current === player) playerRef.current = null;
      player?.destroy();
    };
  }, [elementId, inline, title, youtubeId]);

  return <div id={elementId} className="h-full w-full" />;
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
  const [soundOn, setSoundOn] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

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

  function toggleSound() {
    setSoundOn((current) => !current);
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
      className="mobile-scene-feed h-dvh snap-y snap-mandatory overflow-y-auto overscroll-y-contain md:hidden"
    >
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

          <div className="relative overflow-hidden rounded-2xl border border-bone/10 bg-black shadow-lift">
            <div className="aspect-video">
              {index === activeIndex ? (
                <MobileYouTubePlayer
                  youtubeId={item.youtube_id}
                  startSec={item.playback_start_sec}
                  title={displayTitle(item)}
                  soundOn={soundOn}
                  autoplay={!reducedMotion}
                />
              ) : item.thumbnail_url ? (
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
