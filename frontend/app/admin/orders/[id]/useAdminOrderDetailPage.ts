import { useParams } from "next/navigation";
import { useCallback, useMemo } from "react";

import { isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import { useAdminStandardDetailFetch } from "@/lib/admin/useAdminStandardDetailFetch";
import { routes } from "@/lib/api";
import { stashEscrowOrderPrefetchFromAdminOrderDetailBody } from "@/lib/orderEscrowPrefetch";

import type { AdminOrderDetailRes } from "./adminOrderDetailPageModel";

export function useAdminOrderDetailPage() {
  const params = useParams();
  const rawId = typeof params?.id === "string" ? params.id : "";
  const orderId = decodeURIComponent(rawId.trim());

  const detailUrl = useMemo(
    () => (orderId ? routes.admin.orderById(orderId) : ""),
    [orderId],
  );

  const { body, loading, refreshing, error } = useAdminStandardDetailFetch<AdminOrderDetailRes>({
    scope: "order-detail",
    context: "AdminOrderDetailPage",
    detailUrl,
    resourceId: orderId,
  });

  const order = body?.order && typeof body.order === "object" ? body.order : null;
  const meta = body && isAdminMetaRecord(body.meta) ? body.meta : null;

  const stashAdminDetailEscrowPayPrefetch = useCallback(() => {
    if (!orderId || !order) return;
    stashEscrowOrderPrefetchFromAdminOrderDetailBody(orderId, order, body?.itinerary ?? null);
  }, [orderId, order, body?.itinerary]);

  return { orderId, loading, refreshing, error, body, order, meta, stashAdminDetailEscrowPayPrefetch };
}
