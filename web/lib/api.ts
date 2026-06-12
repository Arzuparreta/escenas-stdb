const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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
  removed: number;
  watched_playlists: number;
}

export async function searchScenes(
  query: string,
  mode: SearchMode,
  exact = false,
): Promise<SearchHit[]> {
  const params = new URLSearchParams({ q: query, mode, exact: String(exact) });
  const response = await fetch(`${API_BASE}/search?${params}`);
  if (!response.ok) throw new Error("Search failed");
  const data = await response.json();
  return data.results;
}

export async function listScenes(status?: string): Promise<Scene[]> {
  const params = status ? `?status=${status}` : "";
  const response = await fetch(`${API_BASE}/scenes${params}`);
  if (!response.ok) throw new Error("Failed to load scenes");
  return response.json();
}

export async function getStatus(): Promise<StatusSummary> {
  const response = await fetch(`${API_BASE}/status`);
  if (!response.ok) throw new Error("Failed to load status");
  return response.json();
}
