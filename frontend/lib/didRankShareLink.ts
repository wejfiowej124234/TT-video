import type { Period } from "@/lib/didRankUtils";

export type DidRankShareBoard = "traveler" | "guide" | "itinerary" | "provider" | "acquisition";

/** 生成 `/did-rank?me=…` 分享路径（相对路径；复制时由调用方补全 origin） */
export function buildDidRankSharePath(
  board: DidRankShareBoard,
  profileId: string,
  period: Period = "all",
): string {
  const id = profileId.trim();
  if (!id) return "/did-rank";
  const params = new URLSearchParams();
  params.set("me", `${board}-${id}`);
  if (period !== "all") params.set("period", period);
  if (board !== "traveler") params.set("board", board);
  return `/did-rank?${params.toString()}`;
}

export function toDidRankShareAbsoluteUrl(path: string): string {
  if (typeof window === "undefined") return path;
  const origin = window.location.origin.replace(/\/$/, "");
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
