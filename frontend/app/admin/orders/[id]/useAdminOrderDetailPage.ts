import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import {
  type AdminFetchErrorKind,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";
import { stashEscrowOrderPrefetchFromAdminOrderDetailBody } from "@/lib/orderEscrowPrefetch";

import type { AdminOrderDetailRes } from "./adminOrderDetailPageModel";

export function useAdminOrderDetailPage() {
  const params = useParams();
  const rawId = typeof params?.id === "string" ? params.id : "";
  const orderId = decodeURIComponent(rawId.trim());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [body, setBody] = useState<AdminOrderDetailRes | null>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setBody(null);
      return;
    }
    setLoading(true);
    setError(null);

    const headers: Record<string, string> = { "x-request-id": `admin-order-detail-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<AdminOrderDetailRes>(
      "AdminOrderDetailPage",
      apiUrl(routes.admin.orderById(orderId)),
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
        logAdminFetch("AdminOrderDetailPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  const order = body?.order && typeof body.order === "object" ? body.order : null;
  const meta = body && isAdminMetaRecord(body.meta) ? body.meta : null;

  const stashAdminDetailEscrowPayPrefetch = useCallback(() => {
    if (!orderId || !order) return;
    stashEscrowOrderPrefetchFromAdminOrderDetailBody(orderId, order, body?.itinerary ?? null);
  }, [orderId, order, body?.itinerary]);

  return { orderId, loading, error, body, order, meta, stashAdminDetailEscrowPayPrefetch };
}
