function apiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:8000`;
  }
  return "http://localhost:8000";
}

export type SearchMode = "phrase" | "film" | "director" | "all";

export interface SearchHit {
  video_id: string;
  youtube_id: string;
  title: string;
  film_title: string | null;
  director: string | null;
  year: number | null;
  matched_text: string;
  context_before: string;
  context_after: string;
  start_sec: number;
  thumbnail_url: string | null;
  youtube_url: string;
}

export interface Scene {
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

export async function searchScenes(
  query: string,
  mode: SearchMode,
  exact = false,
): Promise<SearchHit[]> {
  const params = new URLSearchParams({ q: query, mode, exact: String(exact) });
  const response = await fetch(`${apiBase()}/search?${params}`);
  if (!response.ok) throw new Error("Search failed");
  const data = await response.json();
  return data.results;
}

export async function listScenes(status?: string): Promise<Scene[]> {
  const params = status ? `?status=${status}` : "";
  const response = await fetch(`${apiBase()}/scenes${params}`);
  if (!response.ok) throw new Error("Failed to load scenes");
  return response.json();
}

export async function getStatus(): Promise<StatusSummary> {
  const response = await fetch(`${apiBase()}/status`);
  if (!response.ok) throw new Error("Failed to load status");
  return response.json();
}

/** YouTube no-cookie embed URL starting at the given second. */
export function embedUrl(youtubeId: string, startSec = 0): string {
  const start = Math.max(0, Math.floor(startSec));
  const params = new URLSearchParams({
    start: String(start),
    autoplay: "1",
    rel: "0",
    modestbranding: "1",
  });
  return `https://www.youtube-nocookie.com/embed/${youtubeId}?${params}`;
}
