export type AdminReviewDetailRes = {
  status?: string;
  error?: string;
  review?: Record<string, unknown>;
  meta?: { source?: string; build?: unknown };
};

export function adminReviewDetailFmt(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export const ADMIN_REVIEW_DETAIL_ROW_DEFS: { key: string; labelKey: string }[] = [
  { key: "order_id", labelKey: "admin_reviews_colOrder" },
  { key: "score", labelKey: "admin_reviews_colScore" },
  { key: "weight", labelKey: "admin_review_detail_weight" },
  { key: "reviewer_id", labelKey: "admin_reviews_colReviewer" },
  { key: "reviewee_id", labelKey: "admin_review_detail_reviewee" },
  { key: "comment", labelKey: "admin_reviews_colComment" },
  { key: "created_at", labelKey: "admin_reviews_colCreated" },
];
