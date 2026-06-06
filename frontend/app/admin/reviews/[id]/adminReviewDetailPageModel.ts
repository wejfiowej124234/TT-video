import type { AdminOpsDetailRelatedLink } from "@/components/admin/AdminOpsDetailRelatedFold";
import { ADMIN_OPS_OBSERVABILITY_RELATED_LINK } from "@/lib/admin/adminOpsListRelatedFoldLinks";

export type AdminReviewDetailRes = {  status?: string;
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

export const REVIEW_DETAIL_RELATED_FOLD_LINKS: AdminOpsDetailRelatedLink[] = [
  { href: "/admin/reviews", labelKey: "admin_review_detail_back_list", dataTt: "admin-review-detail-back-list" },
  { href: "/admin/orders", labelKey: "admin_orders_title" },
  { href: "/admin/guides", labelKey: "admin_guides_title" },
  ADMIN_OPS_OBSERVABILITY_RELATED_LINK,
];