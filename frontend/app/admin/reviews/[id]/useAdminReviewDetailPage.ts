import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import {
  type AdminFetchErrorKind,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";

import type { AdminReviewDetailRes } from "./adminReviewDetailPageModel";

export function useAdminReviewDetailPage() {
  const params = useParams();
  const rawId = typeof params?.id === "string" ? params.id : "";
  const reviewId = decodeURIComponent(rawId.trim());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [body, setBody] = useState<AdminReviewDetailRes | null>(null);

  useEffect(() => {
    if (!reviewId) {
      setLoading(false);
      setBody(null);
      return;
    }
    setLoading(true);
    setError(null);

    const headers: Record<string, string> = { "x-request-id": `admin-review-detail-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<AdminReviewDetailRes>(
      "AdminReviewDetailPage",
      apiUrl(routes.admin.reviewById(reviewId)),
      { headers },
    )
      .then(({ res, body: json }) => {
        if (!res.ok) {
          throw new Error(json.error || `request_failed_${res.status}`);
        }
        return json;
      })
      .then(setBody)
      .catch((e: unknown) => {
        logAdminFetch("AdminReviewDetailPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [reviewId]);

  const review = body?.review && typeof body.review === "object" ? body.review : null;
  const source = typeof body?.meta?.source === "string" ? body.meta.source : "";
  const meta = body && isAdminMetaRecord(body.meta) ? body.meta : null;
  const orderId = typeof review?.order_id === "string" ? review.order_id : "";

  return { reviewId, loading, error, body, review, source, meta, orderId };
}
