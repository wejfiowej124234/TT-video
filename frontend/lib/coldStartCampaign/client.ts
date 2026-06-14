import type { ColdStartSurfaceId, ColdStartSurfaceResponse } from "./types";

function apiBaseUrl(): string {
  const raw =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE_URL) ||
    (typeof process !== "undefined" && process.env.CATALOG_API_BASE_URL) ||
    "http://127.0.0.1:8080";
  return raw.replace(/\/$/, "");
}

export async function fetchColdStartCampaignForSurface(
  surface: ColdStartSurfaceId,
  init?: RequestInit,
): Promise<ColdStartSurfaceResponse> {
  const res = await fetch(
    `${apiBaseUrl()}/api/v1/official/cold-start/surfaces/${encodeURIComponent(surface)}`,
    {
      ...init,
      headers: { Accept: "application/json", ...(init?.headers ?? {}) },
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`cold-start surface ${surface} ${res.status}: ${text.slice(0, 200)}`);
  }
  return (await res.json()) as ColdStartSurfaceResponse;
}
