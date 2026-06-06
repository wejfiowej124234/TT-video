import { getDidRankPrizePool } from "@/lib/apiClient/didRankPrizePool";

let warmed = false;

/** ① · 排行榜奖池 HTTP 预热（Tab/路由 hover 或首屏 idle） */
export function warmDidRankPrizePool(): void {
  if (warmed || typeof window === "undefined") return;
  warmed = true;
  void getDidRankPrizePool();
}
