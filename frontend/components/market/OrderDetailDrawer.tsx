"use client";

import { useState, useEffect, useLayoutEffect, useRef, useId, useMemo, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import SupportedTokensPill from "@/components/trust/SupportedTokensPill";
import { useTranslation } from "@/components/LocaleProvider";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import UnifiedItineraryList from "@/components/itinerary/UnifiedItineraryList";
import type { AmountBreakdownUnified } from "@/lib/itineraryUnified";
import { getOrder } from "@/lib/apiClient";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { orderLikeMayOnchainDeposit } from "@/components/escrow/EscrowDetail/escrowOnChainEligibility";
import { mapApiReadError } from "@/lib/mapApiReadError";
import {
  orderDisplayStatusRaw,
  orderProjectionDivergesFromOrderState,
  orderProjectionTerminalDegraded,
  orderStatusLabelKeyFromApiOrder,
} from "@/lib/orderProjectionDisplayStatus";
import type { MarketOrderItinerary } from "@/lib/marketTypes";
import { stashEscrowOrderPrefetchFromDetailDrawer } from "@/lib/orderEscrowPrefetch";
import { touchTargetLink44Classes, travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";
import {
  ORDERS_ESCROW_AUTO_SYNC_POLL_MS,
  orderDetailItemWatchesForBackendEscrowSync,
} from "@/lib/ordersEscrowAutoSyncPoll";

/** 29 §9、52 §3.2 费用拆分（与统一表金额项顺序一致） */
export interface OrderDetailBreakdown {
  hotel?: number;
  food?: number;
  catering?: number;
  tickets?: number;
  guideFee?: number;
  carFee?: number;
  vehicle?: number;
  misc?: number;
  platform_fee?: number;
  total_budget?: number;
}

export interface TransportLeg {
  from: string;
  to: string;
  type: "vehicle" | "rail" | "flight";
}

const GUIDE_LEVEL_KEYS: Record<string, string> = {
  primary: "market_guidePrimary",
  intermediate: "market_guideIntermediate",
  advanced: "market_guideAdvanced",
  expert: "market_guideExpert",
};
const CITY_TRANSPORT_KEYS: Record<string, string> = {
  sedan: "market_transportSedan",
  suv: "market_transportSuv",
  van: "market_transportVan",
};
const LEG_TYPE_KEYS: Record<string, string> = {
  vehicle: "market_transportVehicle",
  rail: "market_transportRail",
  flight: "market_transportFlight",
};

/** 52：与 `MarketOrderItinerary` 同源（discover / GET order） */
export type OrderDetailItinerary = MarketOrderItinerary;

/** P29 订单详情抽屉：行程缩略、预算、版本、Agreement Summary、托管详情与付款指引（/pay）；52 支持 itinerary 统一表展示 */
export interface OrderDetailItem {
  id: string;
  amount?: string;
  currency?: string;
  /** 与 GET order / discover 同源（04 §3.4） */
  state?: string;
  status?: string;
  destination?: string;
  country?: string;
  city?: string;
  days?: number;
  headcount?: number;
  version?: number;
  image?: string | null;
  escrow_address?: string | null;
  breakdown?: OrderDetailBreakdown | null;
  itinerary?: OrderDetailItinerary | null;
  highlights?: string[] | null;
  transportLegs?: TransportLeg[] | null;
  cityTransports?: string[] | null;
  guideLevel?: string | null;
  /** 53：详情 GET 可带子状态 */
  sub_status?: string;
  /** B-097 */
  display_status?: string | null;
  projection_terminal?: Record<string, unknown> | null;
}

/** 53-S5：向导在右侧弹窗内「确认接该项目」后的回调；成功后可关闭抽屉并刷新列表 */
export type OnConfirmAccept = (orderId: string) => Promise<void>;

/** 顶栏高度，抽屉内容与 sticky 标题栏留白，避免被遮挡（P56-004/企业级优化） */
const DRAWER_TOP_SAFE = "3.5rem"; // 56px，与 Header 高度一致

/** 金额展示：保留两位小数，避免 54.599999、7.800000000000001 等浮点噪音 */
function formatAmount(value: number | undefined | null, dash: string): string {
  if (value == null || Number.isNaN(value)) return dash;
  const n = Math.round(value * 100) / 100;
  return n.toFixed(2);
}

function hasUnifiedAmountBreakdown(ab?: AmountBreakdownUnified | null): boolean {
  if (!ab) return false;
  return (
    ab.hotel != null ||
    ab.catering != null ||
    ab.tickets != null ||
    ab.guide_fee != null ||
    ab.vehicle != null ||
    ab.platform_fee != null ||
    ab.total_budget != null
  );
}

/** 市场列表 discover 项上的 legacy breakdown → 52 §3.2 统一金额项（与 UnifiedItineraryList 一致） */
function orderBreakdownToAmountUnified(b: OrderDetailBreakdown | null | undefined): AmountBreakdownUnified | undefined {
  if (!b) return undefined;
  const catering = b.catering ?? b.food;
  const vehicle = b.vehicle ?? b.carFee;
  const platform_fee = b.platform_fee ?? b.misc;
  const out: AmountBreakdownUnified = {
    hotel: b.hotel,
    catering: catering ?? undefined,
    tickets: b.tickets,
    guide_fee: b.guideFee,
    vehicle: vehicle ?? undefined,
    platform_fee: platform_fee ?? undefined,
    total_budget: b.total_budget,
  };
  return hasUnifiedAmountBreakdown(out) ? out : undefined;
}

/** API `amount_breakdown` 优先；缺项用 discover 卡片上的 legacy `breakdown` 补齐（GET 合并后仍可能混源） */
function mergeAmountBreakdownWithLegacy(
  api: AmountBreakdownUnified | undefined | null,
  legacy: OrderDetailBreakdown | null | undefined,
): AmountBreakdownUnified | undefined {
  const leg = orderBreakdownToAmountUnified(legacy);
  const out: AmountBreakdownUnified = {
    hotel: api?.hotel ?? leg?.hotel,
    catering: api?.catering ?? leg?.catering,
    tickets: api?.tickets ?? leg?.tickets,
    guide_fee: api?.guide_fee ?? leg?.guide_fee,
    vehicle: api?.vehicle ?? leg?.vehicle,
    platform_fee: api?.platform_fee ?? leg?.platform_fee,
    total_budget: api?.total_budget ?? leg?.total_budget,
  };
  return hasUnifiedAmountBreakdown(out) ? out : undefined;
}

export default function OrderDetailDrawer({
  order,
  onClose,
  onInvite,
  onConfirmAccept,
  /** B-060：`login_required` 时登录 **`returnUrl`** 保留当前页 **path + query**（如 `/market?view=orders&…`） */
  loginReturnPath,
}: {
  order: OrderDetailItem | null;
  onClose: () => void;
  onInvite?: (orderId: string) => void;
  /** 53-S5：向导点击「确认接该项目」时调用，内部会调 POST accept */
  onConfirmAccept?: OnConfirmAccept;
  loginReturnPath?: string;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [enrichedOrder, setEnrichedOrder] = useState<OrderDetailItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailFetchError, setDetailFetchError] = useState<string | null>(null);
  /** B-046：错误仅展示给触发该次 GET 的 `orderId`，防快速换单串错 */
  const [detailFetchErrorForId, setDetailFetchErrorForId] = useState<string | null>(null);
  /** B-045：`common_retry` 递增以重新跑 GET order（与 `orderId` 变更同源 effect） */
  const [detailFetchRetryTick, setDetailFetchRetryTick] = useState(0);
  /** B-069：`getOrder` 轮询合并 state/escrow，避免列表/首屏快照滞后于 mock-pay 或入金 */
  const [escrowSyncPatch, setEscrowSyncPatch] = useState<Partial<OrderDetailItem> | null>(null);
  const orderRef = useRef(order);
  orderRef.current = order;
  const tRef = useRef(t);
  tRef.current = t;
  const orderId = order?.id;
  const embeddedItineraryLen = order?.itinerary?.daily_itinerary?.length ?? 0;
  const trapRef = useFocusTrap(!!order, onClose);
  const drawerTitleId = useId();
  const drawerDescId = useId();
  const agreementHeadingId = useId();
  const agreementBodyId = useId();

  useEffect(() => {
    if (order) setAgreementOpen(false);
  }, [order]);

  useEffect(() => {
    setEscrowSyncPatch(null);
  }, [orderId]);

  useEffect(() => {
    if (!order) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, [order]);

  /** B-046：换单首帧即进入 loading（需 GET 时），避免仍显示上一单的骨架/闲态 */
  useLayoutEffect(() => {
    if (!order?.id) {
      setLoadingDetail(false);
      return;
    }
    const hasIt =
      order.itinerary?.daily_itinerary && order.itinerary.daily_itinerary.length > 0;
    if (hasIt) {
      setLoadingDetail(false);
      return;
    }
    setLoadingDetail(true);
  }, [order?.id, embeddedItineraryLen]);

  useEffect(() => {
    if (!orderId) {
      setEnrichedOrder(null);
      setLoadingDetail(false);
      setDetailFetchError(null);
      setDetailFetchErrorForId(null);
      return;
    }
    const o = orderRef.current;
    if (!o || o.id !== orderId) {
      setEnrichedOrder(null);
      setLoadingDetail(false);
      setDetailFetchError(null);
      setDetailFetchErrorForId(null);
      return;
    }
    const hasItinerary = o.itinerary?.daily_itinerary && o.itinerary.daily_itinerary.length > 0;
    if (hasItinerary) {
      setEnrichedOrder(null);
      setLoadingDetail(false);
      setDetailFetchError(null);
      setDetailFetchErrorForId(null);
      return;
    }
    /** B-046：与 `orderRef` 比对，避免新单已选后上一单 promise 仍落状态 */
    const requestedId = orderId;
    setLoadingDetail(true);
    setEnrichedOrder(null);
    setDetailFetchError(null);
    setDetailFetchErrorForId(null);
    getOrder(requestedId)
      .then((res) => {
        if (orderRef.current?.id !== requestedId) return;
        const base = orderRef.current;
        if (!base || base.id !== requestedId) return;
        const data = res as { order?: Record<string, unknown>; itinerary?: { daily_itinerary?: unknown[]; amount_breakdown?: Record<string, unknown> } };
        const itinerary = data?.itinerary;
        if (!itinerary) {
          setDetailFetchError(null);
          setDetailFetchErrorForId(null);
          setEnrichedOrder(null);
          return;
        }
        const apiOrder = data?.order;
        const escrowFromApi =
          typeof apiOrder?.escrow_address === "string" ? apiOrder.escrow_address : undefined;
        const stateFromApi = typeof apiOrder?.state === "string" ? apiOrder.state : undefined;
        const daily = Array.isArray(itinerary.daily_itinerary) ? itinerary.daily_itinerary : [];
        const ab = itinerary.amount_breakdown;
        setDetailFetchError(null);
        setDetailFetchErrorForId(null);
        const merged: OrderDetailItem = {
          ...base,
          escrow_address: escrowFromApi ?? base.escrow_address,
          state: stateFromApi ?? base.state,
          itinerary: {
            daily_itinerary: daily as import("@/lib/itineraryUnified").UnifiedDayRow[],
            amount_breakdown: ab
              ? {
                  hotel: typeof ab.hotel === "number" ? ab.hotel : undefined,
                  catering: typeof ab.catering === "number" ? ab.catering : undefined,
                  tickets: typeof ab.tickets === "number" ? ab.tickets : undefined,
                  guide_fee: typeof ab.guide_fee === "number" ? ab.guide_fee : undefined,
                  vehicle: typeof ab.vehicle === "number" ? ab.vehicle : undefined,
                  platform_fee: typeof ab.platform_fee === "number" ? ab.platform_fee : undefined,
                  total_budget: typeof ab.total_budget === "number" ? ab.total_budget : undefined,
                }
              : undefined,
          },
          breakdown:
            ab && typeof ab.total_budget === "number"
              ? {
                  hotel: typeof ab.hotel === "number" ? ab.hotel : undefined,
                  catering: typeof ab.catering === "number" ? ab.catering : undefined,
                  food: typeof ab.catering === "number" ? ab.catering : undefined,
                  tickets: typeof ab.tickets === "number" ? ab.tickets : undefined,
                  guideFee: typeof ab.guide_fee === "number" ? ab.guide_fee : undefined,
                  vehicle: typeof ab.vehicle === "number" ? ab.vehicle : undefined,
                  platform_fee: typeof ab.platform_fee === "number" ? ab.platform_fee : undefined,
                  total_budget: ab.total_budget,
                }
              : base.breakdown ?? undefined,
        };
        setEnrichedOrder(merged);
      })
      .catch((err) => {
        if (typeof window !== "undefined") {
          console.error("OrderDetailDrawer getOrder:", err);
        }
        if (orderRef.current?.id !== requestedId) return;
        if (err instanceof Error && err.message === "login_required") {
          const back = loginReturnPath?.trim();
          if (back) {
            router.replace(`/auth/login?returnUrl=${encodeURIComponent(back)}`);
            return;
          }
        }
        setEnrichedOrder(null);
        setDetailFetchError(mapApiReadError(err, tRef.current, "escrow_loadFailed"));
        setDetailFetchErrorForId(requestedId);
      })
      .finally(() => {
        if (orderRef.current?.id === requestedId) setLoadingDetail(false);
      });
  }, [orderId, embeddedItineraryLen, detailFetchRetryTick, loginReturnPath, router]);

  const watchEscrowSync = useMemo(() => {
    if (!order) return false;
    const merged = { ...order, ...escrowSyncPatch } as OrderDetailItem;
    return orderDetailItemWatchesForBackendEscrowSync(merged);
  }, [order, escrowSyncPatch]);

  useEffect(() => {
    if (!orderId || !order || !watchEscrowSync) return;
    const run = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      getOrder(orderId)
        .then((res) => {
          if (orderRef.current?.id !== orderId) return;
          const data = res as { order?: Record<string, unknown> };
          const apiOrder = data?.order;
          if (!apiOrder) return;
          setEscrowSyncPatch((prev) => {
            const candidate: Partial<OrderDetailItem> = { ...(prev ?? {}) };
            if (typeof apiOrder.state === "string") candidate.state = apiOrder.state;
            if (typeof apiOrder.status === "string") candidate.status = apiOrder.status;
            if (typeof apiOrder.sub_status === "string") candidate.sub_status = apiOrder.sub_status;
            if (typeof apiOrder.escrow_address === "string") {
              candidate.escrow_address = apiOrder.escrow_address;
            } else if (apiOrder.escrow_address === null) {
              candidate.escrow_address = null;
            }
            if (
              prev &&
              candidate.state === prev.state &&
              candidate.status === prev.status &&
              candidate.sub_status === prev.sub_status &&
              candidate.escrow_address === prev.escrow_address
            ) {
              return prev;
            }
            return candidate;
          });
        })
        .catch(() => {});
    };
    const intervalId = setInterval(run, ORDERS_ESCROW_AUTO_SYNC_POLL_MS);
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", run);
    }
    return () => {
      clearInterval(intervalId);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", run);
      }
    };
  }, [orderId, order, watchEscrowSync]);

  if (!order) return null;

  /** B-046：`enrichedOrder` 仅在与当前 `order.id` 一致时采用，禁止上一单 enrich 串显 */
  const baseDisplayOrder: OrderDetailItem =
    enrichedOrder != null && enrichedOrder.id === order.id ? enrichedOrder : order;
  const displayOrder: OrderDetailItem =
    escrowSyncPatch != null ? { ...baseDisplayOrder, ...escrowSyncPatch } : baseDisplayOrder;

  const showDetailFetchError =
    detailFetchError != null &&
    detailFetchErrorForId === orderId &&
    !loadingDetail &&
    !displayOrder.itinerary?.daily_itinerary?.length;
  const stashDrawerEscrowPayPrefetch = () => stashEscrowOrderPrefetchFromDetailDrawer(displayOrder);
  const dash = t("ui_em_dash");
  const orderCurrency = displayOrder.currency ?? t("order_defaultSettlementToken");

  const statusKey = orderStatusLabelKeyFromApiOrder(displayOrder);
  const hasMainStatus =
    Boolean(orderDisplayStatusRaw(displayOrder)) ||
    Boolean(displayOrder.state) ||
    Boolean(displayOrder.status);
  const statusText = hasMainStatus ? t(statusKey) : null;
  const dest = [displayOrder.country, displayOrder.city, displayOrder.destination].filter(Boolean).join(" · ") || dash;
  const imageAlt = dest !== dash ? t("order_imageAlt").replace("{{dest}}", dest) : t("order_imageAltFallback");
  const itineraryDayCount = displayOrder.itinerary?.daily_itinerary?.length ?? 0;
  const amountBreakdownForList = mergeAmountBreakdownWithLegacy(
    displayOrder.itinerary?.amount_breakdown,
    displayOrder.breakdown,
  );

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-black/30 backdrop-blur-sm"
      role="dialog"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      aria-modal="true"
      aria-labelledby={drawerTitleId}
      aria-describedby={drawerDescId}
    >
      <div
        ref={trapRef}
        className="w-full max-w-md bg-bg-console shadow-strong overflow-y-auto animate-in slide-in-from-right duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部留白，避免被顶栏遮挡；sticky 标题栏贴顶栏下方（P56-004 企业级优化） */}
        <div className="min-h-0 flex-1 flex flex-col" style={{ paddingTop: DRAWER_TOP_SAFE }}>
          <div
            className="sticky z-10 flex items-center justify-between border-b border-ink-200 bg-bg-console px-4 py-3 shrink-0"
            style={{ top: DRAWER_TOP_SAFE }}
          >
            <h2 id={drawerTitleId} className="text-body font-semibold text-ink-900 truncate pr-2">
              {dest !== dash ? dest : t("order_drawerTitle")}
            </h2>
            <form
              className="inline shrink-0"
              onSubmit={(e) => {
                e.preventDefault();
                onClose();
              }}
            >
              <button
                type="submit"
                className={`inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-ink-500 hover:bg-bg-soft hover:text-ink-800 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
                aria-label={t("order_closeDrawer")}
              >
                ✕
              </button>
            </form>
          </div>
          <div id={drawerDescId} className="p-4 pb-6 space-y-5 flex-1 min-h-0">
            {displayOrder.image && (
            <div className="rounded-[var(--radius-sm)] overflow-hidden aspect-video bg-bg-soft -mx-4 -mt-0 relative">
              <Image
                src={displayOrder.image}
                alt={imageAlt}
                fill
                className="object-cover"
                loading="lazy"
                onError={(e) => { e.currentTarget.style.display = "none"; const next = e.currentTarget.nextElementSibling; if (next) next.classList.remove("hidden"); }}
                unoptimized
              />
              <div className="hidden absolute inset-0 flex items-center justify-center text-meta text-ink-500" aria-hidden="true">{t("order_imageLoadFailed")}</div>
            </div>
            )}
            <section className="space-y-1">
            <p className="text-h4 font-semibold text-ink-900">{dest}</p>
            <p className="text-small text-ink-500">
              {statusText && <span className="mr-2">{statusText}</span>}
              {displayOrder.days != null ? `${displayOrder.days}${t("order_dayUnit")}` : ""}
              {displayOrder.headcount != null && displayOrder.headcount > 0 ? ` · ${displayOrder.headcount}${t("order_personUnit")}` : ""}
              {" · "}{t("order_versionLabel").replace("{{n}}", String(displayOrder.version ?? 1))}
            </p>
            {(orderProjectionDivergesFromOrderState(displayOrder) || orderProjectionTerminalDegraded(displayOrder)) ? (
              <p className="text-meta text-amber-800 mt-1 leading-snug" role="note">
                {orderProjectionTerminalDegraded(displayOrder)
                  ? t("orders_projection_ssot_degraded")
                  : t("orders_projection_ssot_notice_divergent")}
              </p>
            ) : null}
            </section>
            <section>
            <p className="text-body-l font-semibold text-ink-900">
              {displayOrder.amount != null
                ? formatAmount(parseFloat(String(displayOrder.amount).replace(/,/g, "")), dash)
                : dash}{" "}
              {orderCurrency}
            </p>
            {Array.isArray(displayOrder.cityTransports) && displayOrder.cityTransports.length > 0 && (
              <p className="text-meta text-ink-600 mt-1">
                {t("order_cityTransport")}：{displayOrder.cityTransports.map((ct, i) => `${t("order_dayN").replace("{{n}}", String(i + 1))} ${t(CITY_TRANSPORT_KEYS[ct] ?? "market_transportSedan")}`).join("、")}
              </p>
            )}
            {Array.isArray(displayOrder.transportLegs) && displayOrder.transportLegs.length > 0 && (
              <ul className="text-meta text-ink-600 mt-1 space-y-0.5">
                {displayOrder.transportLegs.map((leg, i) => (
                  <li key={i}>
                    {t("order_interCity")}：{leg.from} → {t(LEG_TYPE_KEYS[leg.type] ?? "market_transportVehicle")} → {leg.to}
                  </li>
                ))}
              </ul>
            )}
            {loadingDetail && !displayOrder.itinerary?.daily_itinerary?.length && (
              <div
                className="mt-3 space-y-2"
                role="status"
                aria-live="polite"
                aria-busy={true}
                aria-label={t("order_detail_loadingItinerary")}
              >
                <p className="sr-only">{t("order_detail_loadingItinerary")}</p>
                <div className="h-3 w-36 max-w-[50%] rounded-[var(--radius-sm)] bg-ink-200/90 animate-pulse" />
                <div className="h-14 w-full rounded-[var(--radius-md)] bg-ink-200/70 animate-pulse" />
                <div className="h-14 w-full rounded-[var(--radius-md)] bg-ink-200/60 animate-pulse" />
              </div>
            )}
            {showDetailFetchError && detailFetchError ? (
              <div className="mt-2 space-y-2">
                <ApiErrorAlert message={detailFetchError} />
                <form
                  className="inline"
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    if (loadingDetail) return;
                    setDetailFetchRetryTick((n) => n + 1);
                  }}
                >
                  <button
                    type="submit"
                    disabled={loadingDetail}
                    aria-label={t("common_retry")}
                    aria-busy={loadingDetail ? true : undefined}
                    className={`${touchTargetLink44Classes} rounded-[var(--radius-sm)] border border-ink-300 bg-white px-3 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 disabled:opacity-50 disabled:cursor-not-allowed ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
                  >
                    {loadingDetail ? t("common_retrying") : t("common_retry")}
                  </button>
                </form>
              </div>
            ) : null}
            {!loadingDetail && displayOrder.itinerary?.daily_itinerary && displayOrder.itinerary.daily_itinerary.length > 0 && (
              <div className="mt-3 rounded-[var(--radius-sm)] border border-ink-200 bg-bg-soft p-3">
                <h3 className="text-small font-semibold text-ink-800 mb-2">{t("order_detail_itineraryTitle")}</h3>
                <UnifiedItineraryList
                  days={displayOrder.itinerary.daily_itinerary}
                  amountBreakdown={amountBreakdownForList}
                  currency={orderCurrency}
                  collapsible={itineraryDayCount > 1}
                  variant="trust"
                  t={t}
                />
              </div>
            )}
            {!loadingDetail && !displayOrder.itinerary?.daily_itinerary?.length && displayOrder.breakdown && (displayOrder.breakdown.guideFee != null || displayOrder.breakdown.carFee != null || displayOrder.breakdown.hotel != null || displayOrder.breakdown.food != null || displayOrder.breakdown.tickets != null) && (
              <ul className="text-meta text-ink-600 mt-2 space-y-1" role="list">
                {displayOrder.breakdown.hotel != null && <li>{t("escrow_hotel")}{formatAmount(displayOrder.breakdown.hotel, dash)} {orderCurrency}</li>}
                {(displayOrder.breakdown.food != null || displayOrder.breakdown.catering != null) && <li>{t("escrow_catering")}{formatAmount(displayOrder.breakdown.food ?? displayOrder.breakdown.catering, dash)} {orderCurrency}</li>}
                {displayOrder.breakdown.tickets != null && <li>{t("escrow_tickets")}{formatAmount(displayOrder.breakdown.tickets, dash)} {orderCurrency}</li>}
                {displayOrder.breakdown.guideFee != null && (
                  <li>
                    {displayOrder.guideLevel && GUIDE_LEVEL_KEYS[displayOrder.guideLevel] && (
                      <>{t(GUIDE_LEVEL_KEYS[displayOrder.guideLevel])} · </>
                    )}
                    {t("escrow_guideFee")}{formatAmount(displayOrder.breakdown.guideFee, dash)} {orderCurrency}
                  </li>
                )}
                {(displayOrder.breakdown.carFee != null || displayOrder.breakdown.vehicle != null) && <li>{t("escrow_vehicle")}{formatAmount(displayOrder.breakdown.carFee ?? displayOrder.breakdown.vehicle, dash)} {orderCurrency}</li>}
                {(displayOrder.breakdown.platform_fee != null || displayOrder.breakdown.misc != null) && <li>{t("escrow_platformFee")}{formatAmount(displayOrder.breakdown.platform_fee ?? displayOrder.breakdown.misc, dash)} {orderCurrency}</li>}
                {displayOrder.breakdown.total_budget != null && <li className="font-semibold text-ink-800 pt-1.5 border-t border-ink-200 mt-1">{t("escrow_totalBudget")}{formatAmount(displayOrder.breakdown.total_budget, dash)} {orderCurrency}</li>}
              </ul>
            )}
            {Array.isArray(displayOrder.highlights) && displayOrder.highlights.length > 0 && (
              <ul className="text-small text-ink-600 mt-2 list-disc list-inside space-y-0.5">
                {displayOrder.highlights.slice(0, 3).map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            )}
            <div className="flex items-center gap-2 mt-1">
              <SupportedTokensPill />
              <span className="text-meta text-ink-500">{t("order_onChain")}</span>
            </div>
            </section>

            <section aria-labelledby={agreementHeadingId}>
            <button
              type="button"
              onClick={() => setAgreementOpen((o) => !o)}
              className={`w-full flex items-center justify-between rounded-[var(--radius-sm)] border border-ink-200 bg-bg-soft/50 px-3 py-2 text-left text-small font-medium text-ink-800 hover:bg-bg-soft ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
              aria-expanded={agreementOpen}
              aria-controls={agreementBodyId}
              id={agreementHeadingId}
              aria-label={agreementOpen ? t("order_detail_agreementCollapse") : t("order_detail_agreementExpand")}
            >
              {t("order_detail_agreementTitle")}
              <span className="text-ink-500" aria-hidden="true">{agreementOpen ? "▼" : "▶"}</span>
            </button>
            {!agreementOpen && (
              <p className="text-meta text-ink-500 mt-1" aria-hidden="true">{t("order_detail_agreementCollapsedHint")}</p>
            )}
            <div id={agreementBodyId} hidden={!agreementOpen} className="mt-2 rounded-[var(--radius-sm)] border border-ink-100 bg-bg-soft/30 px-3 py-2 text-meta text-ink-600 space-y-1">
              <p>{t("order_detail_payToken").replace("{{currency}}", orderCurrency)}</p>
              <p>{t("order_detail_platformFee")}</p>
              <p>{t("order_detail_snapshotHash")}</p>
            </div>
            </section>

            <p className="text-small text-ink-600">{t("order_detail_guideCta")}</p>
            {acceptError && (
              <p className="text-small text-danger" role="alert">{acceptError}</p>
            )}
            <div className="flex flex-col gap-2 pt-2">
            {onConfirmAccept && (displayOrder.status === "draft" || displayOrder.status === "created" || displayOrder.status === "open") && (
              <form
                className="w-full"
                onSubmit={(e) => {
                  e.preventDefault();
                  setAcceptError(null);
                  setAcceptLoading(true);
                  void (async () => {
                    try {
                      await onConfirmAccept(order.id);
                      onClose();
                    } catch (err) {
                      if (typeof window !== "undefined") {
                        console.error("OrderDetailDrawer accept:", err);
                      }
                      if (err instanceof Error && err.message === "login_required") {
                        const back = loginReturnPath?.trim();
                        if (back) {
                          router.replace(`/auth/login?returnUrl=${encodeURIComponent(back)}`);
                          return;
                        }
                      }
                      setAcceptError(mapApiReadError(err, t, "order_error_accept_failed"));
                    } finally {
                      setAcceptLoading(false);
                    }
                  })();
                }}
              >
                <button
                  type="submit"
                  disabled={acceptLoading}
                  className={`btn-console w-full rounded-[var(--radius-sm)] bg-travel-500 px-4 py-2 text-white text-small font-medium disabled:opacity-60 disabled:cursor-not-allowed ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
                  aria-label={t("order_detail_confirmAccept")}
                  aria-busy={acceptLoading ? true : undefined}
                >
                  {acceptLoading ? t("common_submitting") : t("order_detail_confirmAccept")}
                </button>
              </form>
            )}
            <Link
              href={`/escrow/${encodeURIComponent(order.id)}`}
              onClick={stashDrawerEscrowPayPrefetch}
              className={`${touchTargetLink44Classes} btn-console rounded-[var(--radius-sm)] border border-ink-300 px-4 py-2 text-ink-800 text-small font-medium text-center ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
            >
              {t("order_detail_cta")}
            </Link>
            {orderLikeMayOnchainDeposit(displayOrder) && (
              <Link
                href={`/pay?orderId=${encodeURIComponent(displayOrder.id)}`}
                onClick={stashDrawerEscrowPayPrefetch}
                className={`${touchTargetLink44Classes} btn-console rounded-[var(--radius-sm)] border border-travel-500/50 bg-travel-500/5 px-4 py-2 text-travel-700 text-small font-medium text-center ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
              >
                {t("orders_payHub")}
              </Link>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
