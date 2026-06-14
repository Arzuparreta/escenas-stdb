function apiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    const url = `${protocol}//${hostname}:8000`;
    console.log("API base URL:", url);
    return url;
  }
  return "http://localhost:8000";
}

export type FeedMode = "discover" | "search";

export interface FeedHighlight {
  before: string;
  match: string;
  after: string;
}

export interface FeedItem {
  video_id: string;
  youtube_id: string;
  title: string;
  status: string;
  thumbnail_url: string | null;
  film_title: string | null;
  director: string | null;
  year: number | null;
  scene_label: string | null;
  youtube_url: string;
  indexed_at: string | null;
  playback_start_sec: number;
  playback_end_sec: number | null;
  highlight: FeedHighlight | null;
}

export interface FeedResponse {
  mode: FeedMode;
  seed: string;
  items: FeedItem[];
  next_cursor: string | null;
  total: number;
}

export interface StatusSummary {
  total: number;
  ready: number;
  indexing: number;
  discovered: number;
  failed: number;
  no_dialogue: number;
  removed: number;
  watched_playlists: number;
}

export async function getFeed({
  query = "",
  seed,
  cursor,
  limit = 12,
  exact = false,
  signal,
}: {
  query?: string;
  seed?: string;
  cursor?: string | null;
  limit?: number;
  exact?: boolean;
  signal?: AbortSignal;
} = {}): Promise<FeedResponse> {
  const params = new URLSearchParams({ exact: String(exact) });
  if (query) params.set("q", query);
  if (seed) params.set("seed", seed);
  if (cursor) params.set("cursor", cursor);
  params.set("limit", String(limit));
  const response = await fetch(`${apiBase()}/feed?${params}`, { signal });
  if (!response.ok) throw new Error("Failed to load feed");
  return response.json();
}

export async function getStatus(): Promise<StatusSummary> {
  const response = await fetch(`${apiBase()}/status`);
  if (!response.ok) throw new Error("Failed to load status");
  return response.json();
}

/** YouTube no-cookie embed URL starting at the given second. */
export function embedUrl(
  youtubeId: string,
  startSec = 0,
  options: { autoplay?: boolean; muted?: boolean; inline?: boolean } = {},
): string {
  const start = Math.max(0, Math.floor(startSec));
  const params = new URLSearchParams({
    start: String(start),
    autoplay: options.autoplay === false ? "0" : "1",
    rel: "0",
    modestbranding: "1",
    playsinline: options.inline === false ? "0" : "1",
    enablejsapi: "1",
  });
  if (options.muted === true) params.set("mute", "1");
  return `https://www.youtube-nocookie.com/embed/${youtubeId}?${params}`;
}
