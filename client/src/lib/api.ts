import type { ComicGeneration } from "@db/schema";

const API_BASE = "/api";

export async function generateComic(params: {
  url: string;
  numParts: number;
}): Promise<{ cacheId: string }> {
  const response = await fetch(`${API_BASE}/comic`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error("Failed to generate comic");
  }

  return response.json();
}

export async function getComicGeneration(cacheId: string) {
  const response = await fetch(`${API_BASE}/comic/${cacheId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch comic generation");
  }

  return response.json();
}

export async function regenerateComic(cacheId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/comic/${cacheId}/regenerate`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to regenerate comic");
  }
}

export async function getDefaultPrompts(): Promise<{
  summary: string;
  image: string;
}> {
  const response = await fetch(`${API_BASE}/prompts/defaults`);
  if (!response.ok) {
    throw new Error("Failed to fetch default prompts");
  }
  return response.json();
}

export async function getRecentComics(): Promise<ComicGeneration[]> {
  const response = await fetch(`${API_BASE}/comics/recent`);
  if (!response.ok) {
    throw new Error("Failed to fetch recent comics");
  }
  return response.json();
}
