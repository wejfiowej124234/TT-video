"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { PayRouteSuspense } from "@/components/pay/PayRouteSuspense";
import OrderFlowSteps, { orderStateToStep, type OrderFlowStep } from "@/components/escrow/OrderFlowSteps";
import { getMe, getIdempotencyKey, getOrder, orderMockPay } from "@/lib/apiClient";
import { useMeta } from "@/components/MetaProvider";
import { readOrderMockPayEnabledFromMeta } from "@/lib/readOrderMockPayFromMeta";
import { readProtocolPauseFromMeta } from "@/lib/readProtocolPauseFromMeta";
import type { OrderResponse, OrderRow } from "@/components/escrow/EscrowDetail/types";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { stashEscrowOrderPrefetchForPayHubEscrowNav } from "@/lib/orderEscrowPrefetch";
import { computePayDeadlineLines, type PayDeadlineOrderSlice } from "@/lib/payOrderDeadlineHints";
import { orderLikeMayOnchainDeposit } from "@/components/escrow/EscrowDetail/escrowOnChainEligibility";
import { orderStateToStatusLabelKey } from "@/lib/orderStatusI18n";
import FeeRouterWiringNotice from "@/components/escrow/FeeRouterWiringNotice";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { touchTargetLink44Classes, travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";
import {
  buildPayHubLoginReturnPath,
  effectivePayHubOrderId,
  PAY_ORDER_ID_UUID_RE,
} from "@/lib/payOrderIdSource";

const payOrderIdInputFocusClass = `focus:outline-none ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`;

/** 与 `OrderFlowSteps` 内 STEP_LABEL_KEYS 顺序一致（1～8），供支付页文案与步骤条对齐 */
const PAY_ORDER_FLOW_STEP_LABEL_KEYS = [
  "order_steps_step_draft",
  "order_steps_step_guide_confirm",
  "order_steps_step_bilateral",
  "order_steps_step_confirm",
  "order_steps_step_pay",
  "order_steps_step_done",
  "order_steps_step_rating",
  "order_steps_step_release",
] as const;

/** 07 Phase 4 / 5.1：支付与托管入口；资金区克制（13），业务同源 04 API + 托管页。 */
function PayPageInner() {
  const { t } = useTranslation();
  const { meta } = useMeta();
  const mockPayEnabledFromMeta = useMemo(() => readOrderMockPayEnabledFromMeta(meta), [meta]);
  const protocolPaused = useMemo(() => readProtocolPauseFromMeta(meta), [meta]);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fromQuery = searchParams.get("orderId")?.trim() ?? "";
  const [orderIdInput, setOrderIdInput] = useState(fromQuery);
  /** B-032：合法 query 优先；URL 变化时把输入框拉回与 query 一致 */
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
        const params = new URLSearchParams(searchParams.toString());
        if ((params.get("orderId") ?? "").trim() !== trimmed) {
          params.set("orderId", trimmed);
          router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }
        return;
      }
      if (trimmed === "" && searchParams.has("orderId")) {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("orderId");
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }
    },
    [pathname, router, searchParams]
  );
  const [payDeadlineHints, setPayDeadlineHints] = useState<PayDeadlineOrderSlice | null>(null);
  const [orderResponseForEscrowPrefetch, setOrderResponseForEscrowPrefetch] = useState<OrderResponse | null>(null);
  const [orderLoadError, setOrderLoadError] = useState<string | null>(null);
  /** B-050：`GET order` 403 `forbidden`（非参与方）— 勿当 login_required，主区中性说明 + 回订单列表 */
  const [payOrderForbidden, setPayOrderForbidden] = useState(false);
  const [orderFetchTick, setOrderFetchTick] = useState(0);
  const [viewerUserId, setViewerUserId] = useState<string | null>(null);
  const [mockPayBusy, setMockPayBusy] = useState(false);
  const [mockPayError, setMockPayError] = useState<string | null>(null);
  const [mockPayOk, setMockPayOk] = useState(false);
  /** B-053：从 /escrow 后退等恢复 /pay 时，BFCache 会保留旧 React 态；`persisted` 时 bump tick 触发重新 getOrder */
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
    [fromQuery, orderIdInput]
  );

  const payLoginReturnPath = useMemo(
    () => buildPayHubLoginReturnPath(pathname, searchParams.toString(), effectiveOrderId),
    [pathname, searchParams, effectiveOrderId]
  );

  const escrowHref = useMemo(() => {
    return PAY_ORDER_ID_UUID_RE.test(effectiveOrderId) ? `/escrow/${effectiveOrderId}` : null;
  }, [effectiveOrderId]);

  useEffect(() => {
    if (!PAY_ORDER_ID_UUID_RE.test(effectiveOrderId)) {
      setViewerUserId(null);
      return;
    }
    let cancelled = false;
    getMe()
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

  const payOrderFlowStep = useMemo((): OrderFlowStep => {
    if (!PAY_ORDER_ID_UUID_RE.test(effectiveOrderId)) {
      return 5;
    }
    if (payDeadlineHints != null) {
      return orderStateToStep(payDeadlineHints);
    }
    return 5;
  }, [effectiveOrderId, payDeadlineHints]);

  const payFlowBandAria = useMemo(() => {
    if (orderLoadError != null && PAY_ORDER_ID_UUID_RE.test(effectiveOrderId)) {
      return payOrderForbidden ? t("pay_flowBandAria_orderForbidden") : t("pay_flowBandAria_orderLoadError");
    }
    if (payDeadlineHints == null) {
      if (PAY_ORDER_ID_UUID_RE.test(effectiveOrderId) && orderLoadError == null) {
        return t("pay_flowBandAria_waitingForOrder");
      }
      return t("pay_flowBandAria_untilResolved");
    }
    const flowOrder = orderResponseForEscrowPrefetch?.order;
    if (flowOrder != null && !orderLikeMayOnchainDeposit(flowOrder)) {
      return t("pay_flowBandAria_escrowPhase");
    }
    const labelKey = PAY_ORDER_FLOW_STEP_LABEL_KEYS[payOrderFlowStep - 1];
    return t("pay_flowBandAria_fromOrder")
      .replace("{{step}}", String(payOrderFlowStep))
      .replace("{{label}}", t(labelKey));
  }, [orderLoadError, payDeadlineHints, payOrderFlowStep, effectiveOrderId, orderResponseForEscrowPrefetch, payOrderForbidden, t]);

  const payFlowContextText = useMemo(() => {
    if (orderLoadError != null && PAY_ORDER_ID_UUID_RE.test(effectiveOrderId)) {
      return payOrderForbidden ? t("pay_flowContext_orderForbidden") : t("pay_flowContext_orderLoadError");
    }
    if (payDeadlineHints == null) {
      if (PAY_ORDER_ID_UUID_RE.test(effectiveOrderId) && orderLoadError == null) {
        return t("pay_flowContext_waitingForOrder");
      }
      return t("pay_flowContext_untilResolved");
    }
    const orderForFlow = orderResponseForEscrowPrefetch?.order;
    if (
      orderForFlow != null &&
      !orderLikeMayOnchainDeposit(orderForFlow)
    ) {
      return t("pay_flowContext_escrowPhaseHub");
    }
    const labelKey = PAY_ORDER_FLOW_STEP_LABEL_KEYS[payOrderFlowStep - 1];
    return t("pay_flowContext_fromOrder")
      .replace("{{step}}", String(payOrderFlowStep))
      .replace("{{label}}", t(labelKey));
  }, [orderLoadError, payDeadlineHints, payOrderFlowStep, effectiveOrderId, orderResponseForEscrowPrefetch, payOrderForbidden, t]);

  useEffect(() => {
    if (!PAY_ORDER_ID_UUID_RE.test(effectiveOrderId)) {
      setPayDeadlineHints(null);
      setOrderResponseForEscrowPrefetch(null);
      setOrderLoadError(null);
      setPayOrderForbidden(false);
      return;
    }
    setOrderLoadError(null);
    setPayOrderForbidden(false);
    setMockPayOk(false);
    setMockPayError(null);
    /** B-051：每次拉单前清快照，避免与上一轮错误/旧订单 UI 叠显；与重试按钮内联清错一致 */
    setPayDeadlineHints(null);
    setOrderResponseForEscrowPrefetch(null);
    let cancelled = false;
    getOrder(effectiveOrderId)
      .then((res) => {
        if (cancelled) return;
        const data = res as OrderResponse & { order?: PayDeadlineOrderSlice };
        setOrderResponseForEscrowPrefetch(data);
        const o = data?.order;
        if (!o) {
          setPayDeadlineHints(null);
          setOrderResponseForEscrowPrefetch(null);
          setOrderLoadError(t("pay_orderSliceMissing"));
          return;
        }
        setPayDeadlineHints({
          chat_confirm_deadline: o.chat_confirm_deadline,
          payment_deadline: o.payment_deadline,
          state: o.state,
          sub_status: o.sub_status,
          status: o.status,
        });
      })
      .catch((err) => {
        if (!cancelled) {
          if (err instanceof Error && err.message === "login_required") {
            setPayOrderForbidden(false);
            router.replace(`/auth/login?returnUrl=${encodeURIComponent(payLoginReturnPath)}`);
            return;
          }
          if (err instanceof Error && err.message === "forbidden") {
            if (typeof window !== "undefined") {
              console.error("PayPage getOrder:", err);
            }
            setPayDeadlineHints(null);
            setOrderResponseForEscrowPrefetch(null);
            setPayOrderForbidden(true);
            setOrderLoadError(t("pay_orderForbidden_body"));
            return;
          }
          if (typeof window !== "undefined") {
            console.error("PayPage getOrder:", err);
          }
          setPayDeadlineHints(null);
          setOrderResponseForEscrowPrefetch(null);
          setPayOrderForbidden(false);
          setOrderLoadError(mapApiReadError(err, t, "pay_orderLoadFailed"));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [effectiveOrderId, orderFetchTick, payLoginReturnPath, router, t]);

  const stashEscrowNavPrefetch = useCallback(() => {
    const id = effectiveOrderId;
    if (!PAY_ORDER_ID_UUID_RE.test(id)) return;
    stashEscrowOrderPrefetchForPayHubEscrowNav(id, orderResponseForEscrowPrefetch);
  }, [effectiveOrderId, orderResponseForEscrowPrefetch]);

  const orderRow = orderResponseForEscrowPrefetch?.order ?? null;
  const orderLoadedOk =
    PAY_ORDER_ID_UUID_RE.test(effectiveOrderId) && orderRow != null && orderLoadError == null;
  const mayOnchainDeposit = orderLoadedOk && orderLikeMayOnchainDeposit(orderRow);
  /** B-049：尚无 escrow 或未到可链上入金阶段 — 主区以托管详情为轴，弱化入金话术 */
  const emphasizeEscrowHub = orderLoadedOk && !mayOnchainDeposit;
  const awaitingOrderSlice =
    PAY_ORDER_ID_UUID_RE.test(effectiveOrderId) && orderLoadError == null && orderRow == null;

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

  const payPageSubtitle = useMemo(() => {
    if (!PAY_ORDER_ID_UUID_RE.test(effectiveOrderId)) return t("pay_pageSubtitle");
    if (payOrderForbidden) return t("pay_pageSubtitle_orderForbidden");
    if (orderLoadError != null) return t("pay_pageSubtitle");
    if (awaitingOrderSlice) return t("pay_pageSubtitle_whileOrderLoads");
    if (orderRow != null && !orderLikeMayOnchainDeposit(orderRow)) return t("pay_pageSubtitle_escrowPhase");
    return t("pay_pageSubtitle");
  }, [effectiveOrderId, orderLoadError, orderRow, awaitingOrderSlice, payOrderForbidden, t]);

  return (
    <main className="min-h-screen bg-bg-main text-ink-800" aria-label={t("pay_pageTitle")}>
      <div className="container max-w-2xl py-12 px-4">
        <header className="mb-8">
          <h1 className="text-h3 font-semibold tracking-tight text-ink-900">{t("pay_pageTitle")}</h1>
          <p className="mt-3 text-body text-ink-600 leading-relaxed">{payPageSubtitle}</p>
        </header>

        {orderLoadedOk && orderRow && !payOrderForbidden ? (
          <section
            className="mb-8 rounded-[var(--radius-md)] border border-ink-200 bg-bg-console p-5 shadow-soft"
            aria-labelledby={payOrderSummaryHeadingId}
          >
            <h2 id={payOrderSummaryHeadingId} className="sr-only">
              {t("pay_orderSummary_title")}
            </h2>
            <div className="text-small font-semibold text-ink-900">{t("pay_orderSummary_title")}</div>
            <p className="mt-3 text-meta text-ink-600">{t("pay_orderSummary_idLabel")}</p>
            <p className="font-mono text-body text-ink-900 break-all">{orderRow.id}</p>
            <p className="mt-3 text-meta text-ink-600">{t("pay_orderSummary_amountLabel")}</p>
            <p className="text-body font-medium text-ink-900">
              {orderRow.amount ?? t("ui_em_dash")}
              {orderRow.currency ? ` ${orderRow.currency}` : ""}
            </p>
          </section>
        ) : null}

        <div className="mb-8" aria-label={payFlowBandAria}>
          <OrderFlowSteps currentStep={payOrderFlowStep} />
          <p className="mt-3 text-meta text-ink-600 leading-relaxed" role="status">
            {payFlowContextText}
          </p>
        </div>

        <section
          className="rounded-[var(--radius-md)] border border-ink-200 bg-bg-console p-6 shadow-soft"
          aria-labelledby={payStepsHeadingId}
        >
          <h2 id={payStepsHeadingId} className="sr-only">
            {t("pay_pageTitle")}
          </h2>

          {emphasizeEscrowHub && escrowHref ? (
            <div
              className="mb-6 rounded-[var(--radius-md)] border border-travel-500/45 bg-travel-500/[0.08] p-4 sm:p-5"
              role="region"
              aria-labelledby={payEscrowPhaseCalloutId}
            >
              <h3 id={payEscrowPhaseCalloutId} className="text-small font-semibold text-ink-900">
                {t("pay_escrowPhase_calloutTitle")}
              </h3>
              <p className="mt-2 text-small text-ink-700 leading-relaxed">
                {orderRow?.escrow_address
                  ? t("pay_escrowPhase_bodyWithStatus").replace(
                      "{{status}}",
                      t(orderStateToStatusLabelKey(orderRow)),
                    )
                  : t("pay_escrowPhase_bodyNoEscrow")}
              </p>
              <Link
                href={escrowHref}
                onClick={stashEscrowNavPrefetch}
                className={`${touchTargetLink44Classes} mt-4 inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] bg-trust-600 px-5 py-2.5 text-center text-small font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-trust-600 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console`}
              >
                {t("pay_ctaEscrowPrimary")}
              </Link>
            </div>
          ) : null}

          <ol className="list-decimal space-y-3 pl-5 text-body text-ink-700">
            {mayOnchainDeposit ? (
              <>
                <li>{t("pay_step1")}</li>
                <li>{t("pay_step2")}</li>
                <li>{t("pay_step3")}</li>
              </>
            ) : emphasizeEscrowHub ? (
              <>
                <li>{t("pay_escrowHub_step1")}</li>
                <li>{t("pay_escrowHub_step2")}</li>
                <li>{t("pay_escrowHub_step3")}</li>
              </>
            ) : awaitingOrderSlice ? (
              <>
                <li>{t("pay_stepsWhileLoading_1")}</li>
                <li>{t("pay_stepsWhileLoading_2")}</li>
                <li>{t("pay_stepsWhileLoading_3")}</li>
              </>
            ) : (
              <>
                <li>{t("pay_stepsNeutral_1")}</li>
                <li>{t("pay_stepsNeutral_2")}</li>
                <li>{t("pay_stepsNeutral_3")}</li>
              </>
            )}
          </ol>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {emphasizeEscrowHub && escrowHref ? (
              <>
                <Link
                  href={escrowHref}
                  onClick={stashEscrowNavPrefetch}
                  className={`${touchTargetLink44Classes} btn-console inline-flex justify-center rounded-[var(--radius-sm)] bg-trust-600 px-5 py-2.5 text-center text-small font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-trust-600 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console`}
                >
                  {t("pay_ctaEscrowPrimary")}
                </Link>
                <Link
                  href="/orders"
                  className={`${touchTargetLink44Classes} btn-console inline-flex justify-center rounded-[var(--radius-sm)] border border-ink-300 bg-bg-soft px-5 py-2.5 text-center text-small font-semibold text-ink-800 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
                >
                  {t("pay_ctaOrders")}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/orders"
                  className="btn-console inline-flex justify-center rounded-[var(--radius-sm)] bg-trust-600 px-5 py-2.5 text-center text-small font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-trust-600 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console"
                >
                  {t("pay_ctaOrders")}
                </Link>
                {escrowHref ? (
                  <Link
                    href={escrowHref}
                    onClick={stashEscrowNavPrefetch}
                    className={`${touchTargetLink44Classes} btn-console rounded-[var(--radius-sm)] border border-ink-300 bg-bg-soft px-5 py-2.5 text-center text-small font-semibold text-ink-800 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
                  >
                    {t("pay_ctaEscrow")}
                  </Link>
                ) : null}
              </>
            )}
          </div>

          <div className="mt-8 border-t border-ink-200 pt-6">
            <label htmlFor={payOrderInputId} className="block text-small font-medium text-ink-700">
              {t("pay_orderIdLabel")}
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                id={payOrderInputId}
                type="text"
                inputMode="text"
                autoComplete="off"
                placeholder={t("pay_orderIdPlaceholder")}
                value={orderIdInput}
                onChange={(e) => syncOrderIdQuery(e.target.value)}
                className={`w-full rounded-[var(--radius-sm)] border border-ink-300 bg-bg-main px-3 py-2 font-mono text-meta text-ink-900 focus-visible:border-travel-500 ${payOrderIdInputFocusClass}`}
                aria-invalid={
                  orderIdInput.length > 0 && !PAY_ORDER_ID_UUID_RE.test(orderIdInput.trim())
                }
                aria-describedby={
                  orderIdInput.length > 0 && !PAY_ORDER_ID_UUID_RE.test(orderIdInput.trim())
                    ? orderIdInvalidHintId
                    : undefined
                }
              />
              {escrowHref ? (
                <Link
                  href={escrowHref}
                  onClick={stashEscrowNavPrefetch}
                  className={
                    emphasizeEscrowHub
                      ? `${touchTargetLink44Classes} btn-console shrink-0 rounded-[var(--radius-sm)] border border-ink-300 bg-bg-soft px-4 py-2 text-center text-small font-semibold text-ink-800 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`
                      : `${touchTargetLink44Classes} btn-console shrink-0 rounded-[var(--radius-sm)] bg-trust-600 px-4 py-2 text-center text-small font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-trust-600 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console`
                  }
                >
                  {emphasizeEscrowHub ? t("pay_ctaEscrowPrimary") : t("pay_ctaEscrow")}
                </Link>
              ) : null}
            </div>
            {orderIdInput.length > 0 && !PAY_ORDER_ID_UUID_RE.test(orderIdInput.trim()) ? (
              <p id={orderIdInvalidHintId} className="text-meta text-ink-600 mt-2" role="alert">
                {t("pay_orderIdInvalidHint")}
              </p>
            ) : null}
          </div>

          {orderLoadError && escrowHref ? (
            <div className="mt-4 space-y-2">
              {payOrderForbidden ? (
                <div
                  className="rounded-[var(--radius-md)] border border-ink-200 bg-bg-soft p-4"
                  role="status"
                  aria-live="polite"
                >
                  <p className="text-small font-medium text-ink-900">{t("pay_orderForbidden_title")}</p>
                  <p className="mt-2 text-small text-ink-700 leading-relaxed">{orderLoadError}</p>
                  <Link
                    href="/orders"
                    className={`${touchTargetLink44Classes} mt-4 inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] bg-trust-600 px-4 py-2 text-center text-small font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-trust-600 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console`}
                  >
                    {t("pay_orderForbidden_ctaOrders")}
                  </Link>
                </div>
              ) : (
                <>
                  <ApiErrorAlert message={orderLoadError} />
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    {orderLoadError === t("order_error_login_required") ? (
                      <Link
                        href={`/auth/login?returnUrl=${encodeURIComponent(payLoginReturnPath)}`}
                        className={`${touchTargetLink44Classes} text-travel-600 underline underline-offset-2 font-medium text-small ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
                      >
                        {t("orders_goLogin")}
                      </Link>
                    ) : null}
                    <form
                      className="inline"
                      onSubmit={(e: FormEvent) => {
                        e.preventDefault();
                        /** B-051：重试前立即清错，禁止与新一轮失败/成功态叠显 */
                        setOrderLoadError(null);
                        setPayOrderForbidden(false);
                        setPayDeadlineHints(null);
                        setOrderResponseForEscrowPrefetch(null);
                        setOrderFetchTick((n) => n + 1);
                      }}
                    >
                      <button
                        type="submit"
                        aria-label={t("common_retry")}
                        className={`${touchTargetLink44Classes} rounded-[var(--radius-sm)] border border-ink-300 bg-white px-3 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
                      >
                        {t("common_retry")}
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          ) : null}

          {(() => {
            const block = computePayDeadlineLines(payDeadlineHints, t);
            if (!block) return null;
            return (
              <div
                className="mt-6 rounded-[var(--radius-md)] border border-ink-200 bg-bg-soft/90 p-4 space-y-2"
                role="status"
                aria-label={block.ariaLabel}
              >
                {block.lines.map((line, i) => (
                  <p key={i} className="text-small text-ink-700">
                    {line}
                  </p>
                ))}
              </div>
            );
          })()}

          {escrowHref && mayOnchainDeposit ? (
            <div className="mt-6">
              <FeeRouterWiringNotice variant="light" />
            </div>
          ) : null}

          {showMockPayCta && escrowHref ? (
            <div className="mt-6 rounded-[var(--radius-md)] border border-dashed border-ink-300 bg-bg-soft/80 p-4 sm:p-5">
              <p className="text-small text-ink-700 leading-relaxed">{t("pay_mockPay_hint")}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={mockPayBusy || protocolPaused}
                  title={protocolPaused ? t("escrow_protocolPause_title") : undefined}
                  onClick={() => {
                    if (!PAY_ORDER_ID_UUID_RE.test(effectiveOrderId)) return;
                    setMockPayError(null);
                    setMockPayBusy(true);
                    orderMockPay(effectiveOrderId, getIdempotencyKey())
                      .then(() => {
                        setMockPayOk(true);
                        setOrderFetchTick((n) => n + 1);
                      })
                      .catch((e) => {
                        setMockPayOk(false);
                        setMockPayError(mapApiReadError(e, t, "pay_mockPay_failed"));
                      })
                      .finally(() => setMockPayBusy(false));
                  }}
                  className={`${touchTargetLink44Classes} rounded-[var(--radius-sm)] border border-ink-400 bg-bg-main px-4 py-2.5 text-small font-semibold text-ink-900 disabled:opacity-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
                >
                  {mockPayBusy ? t("common_loading") : t("pay_mockPay_cta")}
                </button>
                <Link
                  href={escrowHref}
                  onClick={stashEscrowNavPrefetch}
                  className={`${touchTargetLink44Classes} inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] bg-trust-600 px-4 py-2.5 text-small font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-trust-600 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console`}
                >
                  {t("pay_ctaEscrow")}
                </Link>
              </div>
              {mockPayError ? (
                <div className="mt-3">
                  <ApiErrorAlert message={mockPayError} />
                </div>
              ) : null}
              {mockPayOk ? (
                <p className="mt-3 text-small text-success" role="status">
                  {t("pay_mockPay_ok")}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>

        <p className="mt-6 text-meta leading-relaxed text-ink-500" role="note">
          {t("pay_disclaimer")}
        </p>

        <ProductCrossNav
          ariaLabelKey="pay_relatedNav_aria"
          showGuides
          className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-ink-500"
        />
      </div>
    </main>
  );
}

export default function PayPage() {
  return (
    <PayRouteSuspense>
      <PayPageInner />
    </PayRouteSuspense>
  );
}
