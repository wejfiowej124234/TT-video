import { getDidRankTravelers, getDidRankGuides, getDidRankItineraries } from "@/lib/apiClient";
import type { GuideLeaderboardSort } from "@/lib/didRankUtils";
import type { Period } from "@/lib/didRankUtils";

const warmed = new Set<Period>();

/** ① · 周期 Tab hover 预载主榜 travelers/guides（HTTP 预热；`useDidRankData` 仍有内存 cache） */
export function warmDidRankPeriodData(period: Period): void {
  if (warmed.has(period) || typeof window === "undefined") return;
  warmed.add(period);
  void getDidRankTravelers(period);
  void getDidRankGuides(period, "weighted");
}
