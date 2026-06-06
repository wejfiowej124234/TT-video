import { getDidRankAcquisitions, getDidRankProviders } from "@/lib/apiClient";
import type { Period } from "@/lib/didRankUtils";

const warmed = new Set<string>();

/** ① · 商家/收购副榜 Tab hover 预载 HTTP（配合 chunk 预载与 `useDidRankSecondaryBoard`） */
export function warmDidRankSecondaryBoardData(board: "provider" | "acquisition", period: Period): void {
  const key = `${board}:${period}`;
  if (warmed.has(key) || typeof window === "undefined") return;
  warmed.add(key);
  if (board === "provider") void getDidRankProviders(period);
  else void getDidRankAcquisitions(period);
}
