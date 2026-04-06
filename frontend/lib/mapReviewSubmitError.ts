import { mapApiReadError } from "./mapApiReadError";

/** `POST /api/v1/orders/:id/reviews` 等企业级错误 → 可展示文案（经 mapApiReadError 与订单码表一致，见 37 §2.4） */
export function mapReviewSubmitError(e: unknown, t: (key: string) => string): string {
  const code = e instanceof Error ? e.message : "";
  if (code === "review_db_persist_failed") return t("escrow_reviewDbUnavailable");
  if (code === "review_rate_limit_exceeded") return t("escrow_reviewRateLimited");
  return mapApiReadError(e, t, "escrow_submitReviewFailed");
}
