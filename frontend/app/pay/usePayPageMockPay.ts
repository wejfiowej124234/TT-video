"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { OrderRow } from "@/components/escrow/EscrowDetail/types";
import { getIdempotencyKey, getMeFull, orderMockPay } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { PAY_ORDER_ID_UUID_RE } from "@/lib/payOrderIdSource";

export type UsePayPageMockPayArgs = {
  effectiveOrderId: string;
  metaLoading: boolean;
  mockPayEnabledFromMeta: boolean;
  protocolPaused: boolean;
  orderLoadedOk: boolean;
  orderRow: OrderRow | null;
  payOrderForbidden: boolean;
  escrowHref: string | null;
  t: (key: string) => string;
  bumpOrderFetch: () => void;
};

export function usePayPageMockPay({
  effectiveOrderId,
  metaLoading,
  mockPayEnabledFromMeta,
  protocolPaused,
  orderLoadedOk,
  orderRow,
  payOrderForbidden,
  escrowHref,
  t,
  bumpOrderFetch,
}: UsePayPageMockPayArgs) {
  const [viewerUserId, setViewerUserId] = useState<string | null>(null);
  const [mockPayBusy, setMockPayBusy] = useState(false);
  const [mockPayError, setMockPayError] = useState<string | null>(null);
  const [mockPayOk, setMockPayOk] = useState(false);

  useEffect(() => {
    setMockPayOk(false);
    setMockPayError(null);
  }, [effectiveOrderId]);

  useEffect(() => {
    if (!PAY_ORDER_ID_UUID_RE.test(effectiveOrderId)) {
      setViewerUserId(null);
      return;
    }
    let cancelled = false;
    getMeFull()
      .then((raw) => {
        if (cancelled) return;
        const uid = (raw as { user?: { id?: string } } | null)?.user?.id;
        setViewerUserId(typeof uid === "string" ? uid : null);
      })
      .catch(() => {
        if (!cancelled) setViewerUserId(null);
      });
    return () => {
      cancelled = true;
    };
  }, [effectiveOrderId]);

  const showMockPayCta = useMemo(() => {
    if (
      !mockPayEnabledFromMeta ||
      protocolPaused ||
      !orderLoadedOk ||
      !orderRow ||
      payOrderForbidden
    ) {
      return false;
    }
    const st = String(orderRow.state ?? orderRow.status ?? "").toLowerCase();
    if (st !== "accepted") return false;
    if (!viewerUserId) return false;
    const tid = orderRow.tourist_id ?? orderRow.traveler_id;
    if (!tid || String(tid) !== String(viewerUserId)) return false;
    return true;
  }, [
    mockPayEnabledFromMeta,
    protocolPaused,
    orderLoadedOk,
    orderRow,
    payOrderForbidden,
    viewerUserId,
  ]);

  const showMockPayDisabledExplainer = useMemo(() => {
    if (metaLoading) return false;
    if (mockPayEnabledFromMeta || protocolPaused || payOrderForbidden || !orderLoadedOk || !orderRow)
      return false;
    const st = String(orderRow.state ?? orderRow.status ?? "").toLowerCase();
    if (st !== "accepted") return false;
    if (!viewerUserId) return false;
    const tid = orderRow.tourist_id ?? orderRow.traveler_id;
    if (!tid || String(tid) !== String(viewerUserId)) return false;
    return true;
  }, [
    metaLoading,
    mockPayEnabledFromMeta,
    protocolPaused,
    payOrderForbidden,
    orderLoadedOk,
    orderRow,
    viewerUserId,
  ]);

  const payMockPayAuditSurface = useMemo<"none" | "mock_cta" | "mock_disabled_explain">(() => {
    if ((showMockPayCta || mockPayOk) && escrowHref) return "mock_cta";
    if (showMockPayDisabledExplainer && escrowHref && !showMockPayCta) return "mock_disabled_explain";
    return "none";
  }, [escrowHref, mockPayOk, showMockPayCta, showMockPayDisabledExplainer]);

  const onMockPayClick = useCallback(() => {
    if (!PAY_ORDER_ID_UUID_RE.test(effectiveOrderId)) return;
    setMockPayError(null);
    setMockPayBusy(true);
    orderMockPay(effectiveOrderId, getIdempotencyKey())
      .then(() => {
        setMockPayOk(true);
        bumpOrderFetch();
      })
      .catch((e) => {
        setMockPayOk(false);
        setMockPayError(mapApiReadError(e, t, "pay_mockPay_failed"));
      })
      .finally(() => setMockPayBusy(false));
  }, [bumpOrderFetch, effectiveOrderId, t]);

  return {
    showMockPayCta,
    showMockPayDisabledExplainer,
    payMockPayAuditSurface,
    mockPayOk,
    mockPayBusy,
    mockPayError,
    onMockPayClick,
  };
}
