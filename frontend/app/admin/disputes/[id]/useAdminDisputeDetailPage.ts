import { useParams } from "next/navigation";
import { useMemo } from "react";

import { isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import { useAdminStandardDetailFetch } from "@/lib/admin/useAdminStandardDetailFetch";
import { routes } from "@/lib/api";

import type { AdminDisputeDetailRes } from "./adminDisputeDetailPageModel";

export function useAdminDisputeDetailPage() {
  const params = useParams();
  const rawId = typeof params?.id === "string" ? params.id : "";
  const disputeId = decodeURIComponent(rawId.trim());

  const detailUrl = useMemo(
    () => (disputeId ? routes.admin.disputeById(disputeId) : ""),
    [disputeId],
  );

  const { body, loading, refreshing, error } = useAdminStandardDetailFetch<AdminDisputeDetailRes>({
    scope: "dispute-detail",
    context: "AdminDisputeDetailPage",
    detailUrl,
    resourceId: disputeId,
  });

  const dispute = body?.dispute && typeof body.dispute === "object" ? body.dispute : null;
  const meta = body && isAdminMetaRecord(body.meta) ? body.meta : null;
  const orderId = typeof dispute?.order_id === "string" ? dispute.order_id : "";

  return { disputeId, loading, refreshing, error, body, dispute, meta, orderId };
}
