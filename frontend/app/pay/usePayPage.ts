// search-params gate: parent route provides Suspense boundary.
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { orderStateToStep, type OrderFlowStep } from "@/components/escrow/OrderFlowSteps";
import { useMeta } from "@/components/MetaProvider";
import { readOrderMockPayEnabledFromMeta } from "@/lib/readOrderMockPayFromMeta";
import { allowChainOffMockPayUi } from "@/lib/travelTrustUiGuards";
import { readProtocolPauseFromMeta } from "@/lib/readProtocolPauseFromMeta";
import { orderLikeMayOnchainDeposit } from "@/components/escrow/EscrowDetail/escrowOnChainEligibility";
import {
  buildPayHubLoginReturnPath,
  effectivePayHubOrderId,
  PAY_ORDER_ID_UUID_RE,
} from "@/lib/payOrderIdSource";
import { buildPathnameSearchHref } from "@/lib/marketLoginReturnPath";
import { usePayFlowContextLines } from "./usePayFlowContextLines";
import { usePayPageMockPay } from "./usePayPageMockPay";
import { usePayPageOrderSliceLoad } from "./usePayPageOrderSliceLoad";

/** 07 Phase 4 / 5.1：支付与托管入口；资金区克制（13），业务同源 04 API + 托管页。 */
export function usePayPage() {
  const { t } = useTranslation();
  const { meta, loading: metaLoading } = useMeta();
  const mockPayEnabledFromMeta = useMemo(
    () => allowChainOffMockPayUi() && readOrderMockPayEnabledFromMeta(meta),
    [meta],
  );
  const protocolPaused = useMemo(() => readProtocolPauseFromMeta(meta), [meta]);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fromQuery = searchParams?.get("orderId")?.trim() ?? "";
  const [orderIdInput, setOrderIdInput] = useState(fromQuery);
  useEffect(() => {
    if (PAY_ORDER_ID_UUID_RE.test(fromQuery)) {
      setOrderIdInput(fromQuery);
    }
  }, [fromQuery]);

  const syncOrderIdQuery = useCallback(
    (nextInput: string) => {
      setOrderIdInput(nextInput);
      const trimmed = nextInput.trim();
      if (PAY_ORDER_ID_UUID_RE.test(trimmed)) {
        const params = new URLSearchParams(searchParams?.toString() ?? "");
        if ((params.get("orderId") ?? "").trim() !== trimmed) {
          params.set("orderId", trimmed);
          router.replace(buildPathnameSearchHref(pathname, params.toString()), { scroll: false });
        }
        return;
      }
      if (trimmed === "" && searchParams?.has("orderId")) {
        const params = new URLSearchParams(searchParams?.toString() ?? "");
        params.delete("orderId");
        const qs = params.toString();
        router.replace(buildPathnameSearchHref(pathname, qs), { scroll: false });
      }
    },
    [pathname, router, searchParams],
  );
  const [orderFetchTick, setOrderFetchTick] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const bumpIfPayHubWithOrder = () => {
      if (window.location.pathname !== "/pay") return;
      const oid = new URLSearchParams(window.location.search).get("orderId")?.trim() ?? "";
      if (!PAY_ORDER_ID_UUID_RE.test(oid)) return;
      setOrderFetchTick((n) => n + 1);
    };
    const onPageShow = (ev: PageTransitionEvent) => {
      if (ev.persisted) bumpIfPayHubWithOrder();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const orderIdInvalidHintId = useId();
  const payStepsHeadingId = useId();
  const payOrderInputId = useId();
  const payEscrowPhaseCalloutId = useId();
  const payOrderSummaryHeadingId = useId();

  const effectiveOrderId = useMemo(
    () => effectivePayHubOrderId(fromQuery, orderIdInput.trim()),
    [fromQuery, orderIdInput],
  );

  const payLoginReturnPath = useMemo(
    () => buildPayHubLoginReturnPath(pathname, searchParams?.toString() ?? "", effectiveOrderId),
    [pathname, searchParams, effectiveOrderId],
  );

  const escrowHref = useMemo(() => {
    return PAY_ORDER_ID_UUID_RE.test(effectiveOrderId) ? `/escrow/${effectiveOrderId}` : null;
  }, [effectiveOrderId]);

  const bumpOrderFetch = useCallback(() => {
    setOrderFetchTick((n) => n + 1);
  }, []);

  const orderSlice = usePayPageOrderSliceLoad({
    effectiveOrderId,
    orderFetchTick,
    payLoginReturnPath,
    router,
    t,
    bumpOrderFetch,
  });
  const {
    payDeadlineHints,
    orderResponseForEscrowPrefetch,
    orderLoadError,
    payOrderForbidden,
    stashEscrowNavPrefetch,
    orderRow,
    orderLoadedOk,
    mayOnchainDeposit,
    emphasizeEscrowHub,
    awaitingOrderSlice,
    onRetryOrderFetch,
  } = orderSlice;

  const mockPay = usePayPageMockPay({
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
  });
  const {
    payMockPayAuditSurface,
    showMockPayDisabledExplainer,
    showMockPayCta,
    mockPayOk,
    mockPayBusy,
    mockPayError,
    onMockPayClick,
  } = mockPay;

  const payOrderFlowStep = useMemo((): OrderFlowStep => {
    if (!PAY_ORDER_ID_UUID_RE.test(effectiveOrderId)) {
      return 5;
    }
    if (payDeadlineHints != null) {
      return orderStateToStep(payDeadlineHints);
    }
    return 5;
  }, [effectiveOrderId, payDeadlineHints]);

  const { payFlowBandAria, payFlowContextText } = usePayFlowContextLines({
    t,
    effectiveOrderId,
    payDeadlineHints,
    orderLoadError,
    payOrderForbidden,
    payOrderFlowStep,
    orderResponseForEscrowPrefetch,
  });

  const payPageSubtitle = useMemo(() => {
    if (!PAY_ORDER_ID_UUID_RE.test(effectiveOrderId)) return t("pay_pageSubtitle");
    if (payOrderForbidden) return t("pay_pageSubtitle_orderForbidden");
    if (orderLoadError != null) return t("pay_pageSubtitle");
    if (awaitingOrderSlice) return t("pay_pageSubtitle_whileOrderLoads");
    if (orderRow != null && !orderLikeMayOnchainDeposit(orderRow)) return t("pay_pageSubtitle_escrowPhase");
    return t("pay_pageSubtitle");
  }, [awaitingOrderSlice, effectiveOrderId, orderLoadError, orderRow, payOrderForbidden, t]);

  return {
    t,
    awaitingOrderSlice,
    payMockPayAuditSurface,
    orderFetchPhase: awaitingOrderSlice ? "awaiting_slice" : orderLoadError ? "error" : orderRow ? "ready" : "idle",
    payPageSubtitle,
    orderLoadedOk,
    orderRow,
    payOrderForbidden,
    payOrderSummaryHeadingId,
    payFlowBandAria,
    payOrderFlowStep,
    payFlowContextText,
    payStepsHeadingId,
    payEscrowPhaseCalloutId,
    payOrderInputId,
    orderIdInvalidHintId,
    emphasizeEscrowHub,
    escrowHref,
    mayOnchainDeposit,
    orderIdInput,
    syncOrderIdQuery,
    orderLoadError,
    payLoginReturnPath,
    payDeadlineHints,
    showMockPayDisabledExplainer,
    showMockPayCta,
    mockPayOk,
    mockPayBusy,
    mockPayError,
    protocolPaused,
    effectiveOrderId,
    stashEscrowNavPrefetch,
    onRetryOrderFetch,
    onMockPayClick,
  };
}

export type PayPageViewModel = ReturnType<typeof usePayPage>;
