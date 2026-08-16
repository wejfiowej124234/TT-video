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
import { isMarketDevVarietyOrderId } from "@/lib/marketDevVarietyOrders";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { TT_MARKETING_BTN_MARKET_PRIMARY, TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";
import MarketDetailDrawerFrame from "@/components/market/MarketDetailDrawerFrame";
import {
  marketDetailDrawerAccordionToggle,
  marketDetailDrawerAgreementBody,
  marketDetailDrawerBlockLink,
  marketDetailDrawerHintText,
  marketDetailDrawerPrimaryCtaMatte,
  marketDetailDrawerSummaryStrip,
  marketDetailDrawerCard,
  marketDetailDrawerFooterSticky,
  marketDetailDrawerHeroScrim,
  marketDetailDrawerScrollBody,
  marketDetailDrawerScrollRegion,
  marketDetailDrawerCloseBtn,
  marketDetailDrawerHeaderRow,
  marketDetailDrawerHeroMedia,
  marketDetailDrawerInnerCol,
  marketDetailDrawerPricePill,
  marketDetailDrawerMeta,
  marketDetailDrawerMetaList,
  marketDetailDrawerSecondaryBtn,
  marketDetailDrawerSkeletonBlock,
  marketDetailDrawerSkeletonLine,
  marketDetailDrawerSubtle,
  marketDetailDrawerTitle,
} from "@/components/market/marketDetailDrawerClasses";
import {
  formatMarketOrderDestination,
  marketOrderCardTeaser,
  resolveMarketOrderCoverUrl,
} from "@/lib/marketMediaFallback";
import { communityMediaNextImageUnoptimized } from "@/lib/communityMediaClientUrl";
import { UgcTranslatedText } from "@/components/ugc/UgcTranslatedText";
import {
  ORDERS_ESCROW_AUTO_SYNC_POLL_MS,
  orderDetailItemWatchesForBackendEscrowSync,
} from "@/lib/ordersEscrowAutoSyncPoll";

function DrawerAccordionChevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`shrink-0 text-ref-sun/75 transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-90" : ""}`}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
    </svg>
  );
}

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
  const [itineraryDetailOpen, setItineraryDetailOpen] = useState(false);
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
  /**
   * P0：仅当 GET /orders/:id 成功（参与方）才允许托管/支付入口。
   * `null` = 探测中；`false` = 无权限/失败；`true` = 可进 escrow/pay。
   */
  const [participantReadOk, setParticipantReadOk] = useState<boolean | null>(null);
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
  const itineraryDetailHeadingId = useId();
  const itineraryDetailBodyId = useId();

  useEffect(() => {
    if (order) {
      setAgreementOpen(false);
      setItineraryDetailOpen(false);
    }
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

  /** B-046：换单首帧即进入 loading（需 GET ACL 时），避免仍显示上一单的骨架/闲态 */
  useLayoutEffect(() => {
    if (!order?.id) {
      setLoadingDetail(false);
      setParticipantReadOk(null);
      return;
    }
    if (isMarketDevVarietyOrderId(order.id)) {
      setLoadingDetail(false);
      setParticipantReadOk(false);
      return;
    }
    setLoadingDetail(true);
    setParticipantReadOk(null);
  }, [order?.id]);

  useEffect(() => {
    if (!orderId) {
      setEnrichedOrder(null);
      setLoadingDetail(false);
      setDetailFetchError(null);
      setDetailFetchErrorForId(null);
      setParticipantReadOk(null);
      return;
    }
    const o = orderRef.current;
    if (!o || o.id !== orderId) {
      setEnrichedOrder(null);
      setLoadingDetail(false);
      setDetailFetchError(null);
      setDetailFetchErrorForId(null);
      setParticipantReadOk(null);
      return;
    }
    if (isMarketDevVarietyOrderId(orderId)) {
      setEnrichedOrder(null);
      setLoadingDetail(false);
      setDetailFetchError(null);
      setDetailFetchErrorForId(null);
      setParticipantReadOk(false);
      return;
    }
    /** P0：无论列表是否已带 itinerary，均须 GET 校验参与方后再露托管/支付入口 */
    const requestedId = orderId;
    setLoadingDetail(true);
    setDetailFetchError(null);
    setDetailFetchErrorForId(null);
    setParticipantReadOk(null);
    getOrder(requestedId)
      .then((res) => {
        if (orderRef.current?.id !== requestedId) return;
        const base = orderRef.current;
        if (!base || base.id !== requestedId) return;
        const data = res as { order?: Record<string, unknown>; itinerary?: { daily_itinerary?: unknown[]; amount_breakdown?: Record<string, unknown> } };
        const itinerary = data?.itinerary;
        const apiOrder = data?.order;
        const escrowFromApi =
          typeof apiOrder?.escrow_address === "string" ? apiOrder.escrow_address : undefined;
        const stateFromApi = typeof apiOrder?.state === "string" ? apiOrder.state : undefined;
        setDetailFetchError(null);
        setDetailFetchErrorForId(null);
        setParticipantReadOk(true);
        if (!itinerary) {
          setEnrichedOrder(null);
          return;
        }
        const daily = Array.isArray(itinerary.daily_itinerary) ? itinerary.daily_itinerary : [];
        const ab = itinerary.amount_breakdown;
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
          setParticipantReadOk(false);
          const back = loginReturnPath?.trim();
          if (back) {
            router.replace(`/auth/login?returnUrl=${encodeURIComponent(back)}`);
            return;
          }
        }
        setEnrichedOrder(null);
        setParticipantReadOk(false);
        setDetailFetchError(mapApiReadError(err, tRef.current, "escrow_loadFailed"));
        setDetailFetchErrorForId(requestedId);
      })
      .finally(() => {
        if (orderRef.current?.id === requestedId) setLoadingDetail(false);
      });
  }, [orderId, detailFetchRetryTick, loginReturnPath, router]);

  const watchEscrowSync = useMemo(() => {
    if (!order || participantReadOk !== true) return false;
    const merged = { ...order, ...escrowSyncPatch } as OrderDetailItem;
    return orderDetailItemWatchesForBackendEscrowSync(merged);
  }, [order, escrowSyncPatch, participantReadOk]);

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
  const stashDrawerEscrowPayPrefetch = () => {
    if (participantReadOk !== true) return;
    stashEscrowOrderPrefetchFromDetailDrawer(displayOrder);
  };
  const showParticipantEscrowPay = participantReadOk === true;
  const dash = t("ui_em_dash");
  const orderCurrency = displayOrder.currency ?? t("order_defaultSettlementToken");

  const statusKey = orderStatusLabelKeyFromApiOrder(displayOrder);
  const hasMainStatus =
    Boolean(orderDisplayStatusRaw(displayOrder)) ||
    Boolean(displayOrder.state) ||
    Boolean(displayOrder.status);
  const statusText = hasMainStatus ? t(statusKey) : null;
  const dest = formatMarketOrderDestination(displayOrder, dash);
  const orderHeroImageSrc = resolveMarketOrderCoverUrl(displayOrder);
  const imageAlt = dest !== dash ? t("order_imageAlt").replace("{{dest}}", dest) : t("order_imageAltFallback");
  const amountDisplay =
    displayOrder.amount != null
      ? formatAmount(parseFloat(String(displayOrder.amount).replace(/,/g, "")), dash)
      : dash;
  const itineraryDayCount = displayOrder.itinerary?.daily_itinerary?.length ?? 0;
  const amountBreakdownForList = mergeAmountBreakdownWithLegacy(
    displayOrder.itinerary?.amount_breakdown,
    displayOrder.breakdown,
  );
  const hasItineraryDays = (displayOrder.itinerary?.daily_itinerary?.length ?? 0) > 0;
  const hasLegacyBreakdown =
    !hasItineraryDays &&
    displayOrder.breakdown != null &&
    (displayOrder.breakdown.guideFee != null ||
      displayOrder.breakdown.carFee != null ||
      displayOrder.breakdown.hotel != null ||
      displayOrder.breakdown.food != null ||
      displayOrder.breakdown.tickets != null);
  const hasQuoteDetail = hasItineraryDays || hasLegacyBreakdown;
  const itineraryTeaser =
    marketOrderCardTeaser(displayOrder) ??
    displayOrder.itinerary?.daily_itinerary?.[0]?.description?.trim() ??
    null;
  const itineraryTeaserCollapsed =
    itineraryTeaser ??
    (displayOrder.days != null
      ? t("order_daysItinerary").replace("{{n}}", String(displayOrder.days))
      : null) ??
    (dest !== dash ? dest : null) ??
    t("market_drawer_itinerary_teaser_placeholder");

  return (
    <MarketDetailDrawerFrame
      panelRef={trapRef}
      panelVariant="stickyFooter"
      onRequestClose={onClose}
      aria-labelledby={drawerTitleId}
      aria-describedby={drawerDescId}
      aria-busy={loadingDetail ? true : undefined}
    >
      <div className={marketDetailDrawerInnerCol}>
        <div className={marketDetailDrawerHeaderRow}>
          <h2 id={drawerTitleId} className={marketDetailDrawerTitle}>
            {dest !== dash ? dest : t("order_drawerTitle")}
          </h2>
          <form
            className="inline shrink-0"
            onSubmit={(e) => {
              e.preventDefault();
              onClose();
            }}
          >
            <button type="submit" className={marketDetailDrawerCloseBtn} aria-label={t("order_closeDrawer")}>
              ✕
            </button>
          </form>
        </div>
        <div className={marketDetailDrawerScrollRegion}>
          <div id={drawerDescId} className={marketDetailDrawerScrollBody}>
            <div className={marketDetailDrawerHeroMedia}>
              <Image
                src={orderHeroImageSrc}
                alt={imageAlt}
                fill
                className="object-cover"
                loading="lazy"
                unoptimized={communityMediaNextImageUnoptimized(orderHeroImageSrc)}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const next = e.currentTarget.nextElementSibling;
                  if (next) next.classList.remove("hidden");
                }}
              />
              <div
                className="hidden absolute inset-0 z-[1] flex items-center justify-center text-meta text-slate-400"
                aria-hidden="true"
              >
                {t("order_imageLoadFailed")}
              </div>
              <div className={marketDetailDrawerHeroScrim} aria-hidden="true" />
              <div className="pointer-events-none absolute bottom-3 left-4 z-[2] flex flex-wrap items-end gap-2">
                <span className={marketDetailDrawerPricePill}>
                  {amountDisplay} {orderCurrency}
                </span>
              </div>
            </div>

            <section className="space-y-2">
              <p className={`text-small ${marketDetailDrawerSubtle}`}>
                {statusText ? <span className="mr-2 text-slate-200">{statusText}</span> : null}
                {displayOrder.days != null ? `${displayOrder.days}${t("order_dayUnit")}` : ""}
                {displayOrder.headcount != null && displayOrder.headcount > 0
                  ? ` · ${displayOrder.headcount}${t("order_personUnit")}`
                  : ""}
                {" · "}
                {t("order_versionLabel").replace("{{n}}", String(displayOrder.version ?? 1))}
              </p>
              {(orderProjectionDivergesFromOrderState(displayOrder) ||
                orderProjectionTerminalDegraded(displayOrder)) && (
                <p className="text-meta text-warning/95 leading-snug" role="note">
                  {orderProjectionTerminalDegraded(displayOrder)
                    ? t("orders_projection_ssot_degraded")
                    : t("orders_projection_ssot_notice_divergent")}
                </p>
              )}
              <SupportedTokensPill tone="dark" />
            </section>

            {!itineraryDetailOpen ? (
              <section className={marketDetailDrawerSummaryStrip} aria-label={t("order_detail_itineraryTitle")}>
                <p className="text-small font-medium text-slate-100 line-clamp-1">
                  {dest !== dash ? dest : t("order_drawerTitle")}
                </p>
                <p className={`${marketDetailDrawerHintText} mt-1 line-clamp-2`}>
                  {itineraryTeaser ? (
                    <UgcTranslatedText
                      as="span"
                      policy="cache_first"
                      contentClass="itinerary"
                      contentId={displayOrder.id}
                      field="teaser"
                      originalText={itineraryTeaser}
                    />
                  ) : (
                    itineraryTeaserCollapsed
                  )}
                </p>
              </section>
            ) : null}

          <section className="space-y-3">
            {Array.isArray(displayOrder.cityTransports) && displayOrder.cityTransports.length > 0 && (
              <p className={marketDetailDrawerMeta}>
                {t("order_cityTransport")}：
                {displayOrder.cityTransports
                  .map(
                    (ct, i) =>
                      `${t("order_dayN").replace("{{n}}", String(i + 1))} ${t(CITY_TRANSPORT_KEYS[ct] ?? "market_transportSedan")}`,
                  )
                  .join("、")}
              </p>
            )}
            {Array.isArray(displayOrder.transportLegs) && displayOrder.transportLegs.length > 0 && (
              <ul className={marketDetailDrawerMetaList}>
                {displayOrder.transportLegs.map((leg, i) => (
                  <li key={i}>
                    {t("order_interCity")}：{leg.from} → {t(LEG_TYPE_KEYS[leg.type] ?? "market_transportVehicle")} →{" "}
                    {leg.to}
                  </li>
                ))}
              </ul>
            )}
            {loadingDetail && !displayOrder.itinerary?.daily_itinerary?.length && (
              <div
                className="space-y-2"
                role="status"
                aria-live="polite"
                aria-busy={true}
                aria-label={t("order_detail_loadingItinerary")}
              >
                <p className="sr-only">{t("order_detail_loadingItinerary")}</p>
                <div className={`h-3 w-36 max-w-[50%] ${marketDetailDrawerSkeletonLine}`} />
                <div className={`h-14 w-full ${marketDetailDrawerSkeletonBlock}`} />
                <div className={`h-14 w-full ${marketDetailDrawerSkeletonBlock}`} />
              </div>
            )}
            {showDetailFetchError && detailFetchError ? (
              <div className="space-y-2">
                <ApiErrorAlert message={detailFetchError} tone="dark" />
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
                    className={marketDetailDrawerSecondaryBtn}
                  >
                    {loadingDetail ? t("common_retrying") : t("common_retry")}
                  </button>
                </form>
              </div>
            ) : null}
            {!loadingDetail && hasQuoteDetail && (
              <section aria-labelledby={itineraryDetailHeadingId}>
                <button
                  type="button"
                  onClick={() => setItineraryDetailOpen((o) => !o)}
                  className={marketDetailDrawerAccordionToggle}
                  aria-expanded={itineraryDetailOpen}
                  aria-controls={itineraryDetailBodyId}
                  id={itineraryDetailHeadingId}
                  aria-label={
                    itineraryDetailOpen
                      ? t("market_drawer_itinerary_collapse")
                      : t("market_drawer_itinerary_expand")
                  }
                >
                  {t("order_detail_itineraryTitle")}
                  <DrawerAccordionChevron open={itineraryDetailOpen} />
                </button>
                <div id={itineraryDetailBodyId} hidden={!itineraryDetailOpen} className="mt-2 space-y-3">
                  {hasItineraryDays && displayOrder.itinerary?.daily_itinerary && (
                    <div className={marketDetailDrawerCard}>
                      <UnifiedItineraryList
                        days={displayOrder.itinerary.daily_itinerary}
                        amountBreakdown={amountBreakdownForList}
                        currency={orderCurrency}
                        collapsible={itineraryDayCount > 1}
                        variant="marketDark"
                        t={t}
                      />
                    </div>
                  )}
                  {hasLegacyBreakdown && displayOrder.breakdown && (
                    <div className={marketDetailDrawerCard}>
                      <ul className={`${marketDetailDrawerMetaList} space-y-1`} role="list">
                        {displayOrder.breakdown.hotel != null && (
                          <li>
                            {t("escrow_hotel")}
                            {formatAmount(displayOrder.breakdown.hotel, dash)} {orderCurrency}
                          </li>
                        )}
                        {(displayOrder.breakdown.food != null || displayOrder.breakdown.catering != null) && (
                          <li>
                            {t("escrow_catering")}
                            {formatAmount(displayOrder.breakdown.food ?? displayOrder.breakdown.catering, dash)}{" "}
                            {orderCurrency}
                          </li>
                        )}
                        {displayOrder.breakdown.tickets != null && (
                          <li>
                            {t("escrow_tickets")}
                            {formatAmount(displayOrder.breakdown.tickets, dash)} {orderCurrency}
                          </li>
                        )}
                        {displayOrder.breakdown.guideFee != null && (
                          <li>
                            {displayOrder.guideLevel && GUIDE_LEVEL_KEYS[displayOrder.guideLevel] && (
                              <>{t(GUIDE_LEVEL_KEYS[displayOrder.guideLevel])} · </>
                            )}
                            {t("escrow_guideFee")}
                            {formatAmount(displayOrder.breakdown.guideFee, dash)} {orderCurrency}
                          </li>
                        )}
                        {(displayOrder.breakdown.carFee != null || displayOrder.breakdown.vehicle != null) && (
                          <li>
                            {t("escrow_vehicle")}
                            {formatAmount(displayOrder.breakdown.carFee ?? displayOrder.breakdown.vehicle, dash)}{" "}
                            {orderCurrency}
                          </li>
                        )}
                        {(displayOrder.breakdown.platform_fee != null || displayOrder.breakdown.misc != null) && (
                          <li>
                            {t("escrow_platformFee")}
                            {formatAmount(displayOrder.breakdown.platform_fee ?? displayOrder.breakdown.misc, dash)}{" "}
                            {orderCurrency}
                          </li>
                        )}
                        {displayOrder.breakdown.total_budget != null && (
                          <li className="font-semibold text-slate-200 pt-1.5 border-t border-ref-sun/16 mt-1">
                            {t("escrow_totalBudget")}
                            {formatAmount(displayOrder.breakdown.total_budget, dash)} {orderCurrency}
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}
            {Array.isArray(displayOrder.highlights) && displayOrder.highlights.length > 0 && (
              <ul className="text-small text-slate-300 list-disc list-inside space-y-0.5">
                {displayOrder.highlights.slice(0, 3).map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby={agreementHeadingId}>
            <button
              type="button"
              onClick={() => setAgreementOpen((o) => !o)}
              className={marketDetailDrawerAccordionToggle}
              aria-expanded={agreementOpen}
              aria-controls={agreementBodyId}
              id={agreementHeadingId}
              aria-label={agreementOpen ? t("order_detail_agreementCollapse") : t("order_detail_agreementExpand")}
            >
              {t("order_detail_agreementTitle")}
              <DrawerAccordionChevron open={agreementOpen} />
            </button>
            {!agreementOpen && (
              <p className={`${marketDetailDrawerHintText} mt-1`} aria-hidden="true">
                {t("order_detail_agreementCollapsedHint")}
              </p>
            )}
            <div id={agreementBodyId} hidden={!agreementOpen} className={marketDetailDrawerAgreementBody}>
              <p>{t("order_detail_payToken").replace("{{currency}}", orderCurrency)}</p>
              <p>{t("order_detail_platformFee")}</p>
              <p>{t("order_detail_snapshotHash")}</p>
            </div>
          </section>

          </div>
        </div>
        <div className={marketDetailDrawerFooterSticky}>
          <p className={`${marketDetailDrawerHintText} pb-1`}>{t("order_detail_guideCta")}</p>
          {acceptError && (
            <p className="text-small text-danger" role="alert">
              {acceptError}
            </p>
          )}
          {onConfirmAccept &&
            !isMarketDevVarietyOrderId(order.id) &&
            (displayOrder.status === "draft" ||
              displayOrder.status === "created" ||
              displayOrder.status === "open") && (
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
                    className={marketDetailDrawerPrimaryCtaMatte}
                  aria-label={t("order_detail_confirmAccept")}
                  aria-busy={acceptLoading ? true : undefined}
                >
                  {acceptLoading ? t("common_submitting") : t("order_detail_confirmAccept")}
                </button>
              </form>
            )}
          {showParticipantEscrowPay ? (
            <Link
              href={`/escrow/${encodeURIComponent(order.id)}`}
              onClick={stashDrawerEscrowPayPrefetch}
              className={marketDetailDrawerBlockLink}
              data-tt-order-drawer-escrow="1"
            >
              {t("order_detail_cta")}
            </Link>
          ) : null}
          {showParticipantEscrowPay && orderLikeMayOnchainDeposit(displayOrder) ? (
            <Link
              href={`/pay?orderId=${encodeURIComponent(displayOrder.id)}`}
              onClick={stashDrawerEscrowPayPrefetch}
              className={`${touchTargetLink44Classes} text-small font-medium text-center ${TT_MARKETING_MARKET_DARK_PATH.inlineLinkUnderline} ${TT_MARKETING_MARKET_DARK_PATH.drawerControlFocus}`}
              data-tt-order-drawer-pay="1"
            >
              {t("orders_payHub")}
            </Link>
          ) : null}
          {participantReadOk === false ? (
            <p className={`${marketDetailDrawerHintText} pt-1`} role="status" data-tt-order-drawer-escrow-gated="1">
              {t("order_detail_escrow_gated_hint")}
            </p>
          ) : null}
        </div>
      </div>
    </MarketDetailDrawerFrame>
  );
}
