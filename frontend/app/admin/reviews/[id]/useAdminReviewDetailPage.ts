import { useParams } from "next/navigation";
import { useMemo } from "react";

import { isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import { useAdminStandardDetailFetch } from "@/lib/admin/useAdminStandardDetailFetch";
import { routes } from "@/lib/api";

import type { AdminReviewDetailRes } from "./adminReviewDetailPageModel";

export function useAdminReviewDetailPage() {
  const params = useParams();
  const rawId = typeof params?.id === "string" ? params.id : "";
  const reviewId = decodeURIComponent(rawId.trim());

  const detailUrl = useMemo(() => (reviewId ? routes.admin.reviewById(reviewId) : ""), [reviewId]);

  const { body, loading, refreshing, error } = useAdminStandardDetailFetch<AdminReviewDetailRes>({
    scope: "review-detail",
    context: "AdminReviewDetailPage",
    detailUrl,
    resourceId: reviewId,
  });

  const review = body?.review && typeof body.review === "object" ? body.review : null;
  const source = typeof body?.meta?.source === "string" ? body.meta.source : "";
  const meta = body && isAdminMetaRecord(body.meta) ? body.meta : null;
  const orderId = typeof review?.order_id === "string" ? review.order_id : "";

  return { reviewId, loading, refreshing, error, body, review, source, meta, orderId };
}
