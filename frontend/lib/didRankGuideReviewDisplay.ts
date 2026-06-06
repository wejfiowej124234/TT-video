import type { GuideRankItem } from "@/lib/didRankTypes";

/**
 * One-line summary for guide leaderboard cards when API provides review stats
 * (04 附录 did-rank · received_review_count / avg_received_review_score).
 */
export function formatDidRankGuideReviewLine(
  item: Pick<GuideRankItem, "receivedReviewCount" | "avgReceivedReviewScore">,
  t: (key: string) => string,
): string | null {
  const n = item.receivedReviewCount ?? 0;
  const rawAvg = item.avgReceivedReviewScore;
  const hasAvg = rawAvg != null && Number.isFinite(rawAvg);
  if (n <= 0 && !hasAvg) return null;

  const countStr = n > 0 ? `${n} ${t("didRank_receivedReviews_unit")}` : "";
  if (hasAvg && n > 0) {
    return `${t("didRank_avgScore_short")} ${(rawAvg as number).toFixed(1)} · ${countStr}`;
  }
  if (hasAvg) {
    return `${t("didRank_avgScore_short")} ${(rawAvg as number).toFixed(1)}`;
  }
  return countStr || null;
}
