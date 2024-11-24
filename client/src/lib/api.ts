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