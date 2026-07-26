// search-params gate: parent route provides Suspense boundary.
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { useAdminStandardListFetch } from "@/lib/admin/useAdminStandardListFetch";
import { routes } from "@/lib/api";

import {
  STATUS_MAX,
  type AdminDispute,
  buildDisputesListPath,
  clampDisputeLimit,
  parseDisputesListQuery,
} from "./adminDisputesPageModel";

export function useAdminDisputesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { limit, status, orderId, disputeId, q } = useMemo(
    () => parseDisputesListQuery(new URLSearchParams(searchParams?.toString() ?? "")),
    [searchParams],
  );

  const listUrl = useMemo(
    () =>
      routes.admin.disputes({
        limit,
        ...(status ? { status } : {}),
        ...(disputeId ? { id: disputeId } : {}),
        ...(orderId ? { order_id: orderId } : {}),
        ...(q ? { q } : {}),
      }),
    [limit, status, disputeId, orderId, q],
  );

  const { items, appliedFilters, meta, loading, refreshing, error } =
    useAdminStandardListFetch<AdminDispute>({
      scope: "disputes",
      context: "AdminDisputesPage",
      listUrl,
    });

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftStatus, setDraftStatus] = useState(status);
  const [draftDisputeId, setDraftDisputeId] = useState(disputeId);
  const [draftOrderId, setDraftOrderId] = useState(orderId);
  const [draftQ, setDraftQ] = useState(q);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftStatus(status);
    setDraftDisputeId(disputeId);
    setDraftOrderId(orderId);
    setDraftQ(q);
  }, [limit, status, disputeId, orderId, q]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const lim = clampDisputeLimit(Number.parseInt(draftLimit.trim(), 10));
    const st = draftStatus.trim().slice(0, STATUS_MAX);
    router.push(
      buildDisputesListPath({
        limit: lim,
        status: st,
        orderId: draftOrderId.trim(),
        disputeId: draftDisputeId.trim(),
        q: draftQ.trim(),
      }),
    );
  };

  const reset = () => {
    router.push(buildDisputesListPath({ limit: 100, status: "" }));
  };

  return {
    loading,
    refreshing,
    error,
    items,
    orderId,
    disputeId,
    q,
    appliedFilters,
    meta,
    draftLimit,
    setDraftLimit,
    draftStatus,
    setDraftStatus,
    draftDisputeId,
    setDraftDisputeId,
    draftOrderId,
    setDraftOrderId,
    draftQ,
    setDraftQ,
    apply,
    reset,
  };
}
