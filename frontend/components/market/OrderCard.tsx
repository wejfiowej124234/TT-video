"use client";

import { memo, type MouseEvent } from "react";
import Link from "next/link";
import EscrowEnabledBadge from "@/components/trust/EscrowEnabledBadge";
import { MarketOrderCover } from "@/components/market/MarketOrderCover";
import { useTranslation } from "@/components/LocaleProvider";
import { orderLikeMayOnchainDeposit } from "@/components/escrow/EscrowDetail/escrowOnChainEligibility";
import type { OrderCardItem, OrderBreakdown, TransportLeg } from "@/lib/marketTypes";
import { resolveMarketOrderCardTeaser } from "@/lib/marketDisplayCopy";
import { stashEscrowOrderPrefetchFromMarketCard } from "@/lib/orderEscrowPrefetch";
import { orderStateToBadgeVariant, orderStateToStatusLabelKey } from "@/lib/orderStatusI18n";
import { touchTargetLink44Classes, travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";
import { isMarketDevVarietyOrderId } from "@/lib/marketDevVarietyOrders";
import { isOrderPublishedToDiscover } from "@/lib/isAssignedGuideId";
import { isOwnPublishedOpenListing, marketOrderHasAssignedGuide } from "@/lib/marketBindOrderList";
import { useViewerUserId } from "@/lib/useViewerUserId";
import { CONSUMER_TRIP_CURRENCY_LOCALE_KEY } from "@/lib/escrowOrderAmountSsot";
import { MarketDisplayTestBadge } from "@/components/market/MarketDisplayTestBadge";
import { shouldShowMarketOrderDisplayTestLabel } from "@/lib/marketDisplayTestLabel";
import { TT_MARKETING_BTN_MARKET_PRIMARY, TT_MARKETING_MARKET_DARK_PATH, TT_MARKETING_MARKET_L5_LIST_CARD_FRAME, TT_MARKETING_MARKET_L5_LIST_CARD_INNER } from "@/lib/marketingUi";
import { UgcTranslatedText } from "@/components/ugc/UgcTranslatedText";

/** P29 订单卡片：行程照片 + 收藏 + 抢订单/查看行程；28 玻璃态 + Web3 徽章 */
export type { OrderCardItem, OrderBreakdown, TransportLeg } from "@/lib/marketTypes";

export default memo(function OrderCard({
  item,
  onGrabOrder,
  onViewDetail,
  isFavorited,
  onToggleFavorite,
  glass,
  bindingOrderId,
  isSelectedBindingTarget = false,
  coverEager = false,
}: {
  item: OrderCardItem;
  onGrabOrder?: (id: string) => void;
  onViewDetail?: (id: string) => void;
  isFavorited?: boolean;
  onToggleFavorite?: (id: string) => void;
  glass?: boolean;
  /** Escrow 深链：标记并保护旅客本单（不可抢自己的单） */
  bindingOrderId?: string;
  /** 多笔「我的订单」时左栏点选绑定向导目标 */
  isSelectedBindingTarget?: boolean;
  coverEager?: boolean;
}) {
  const { t } = useTranslation();
  const dash = t("ui_em_dash");
  const settledCurrency = t(CONSUMER_TRIP_CURRENCY_LOCALE_KEY);
  const routeLabel = item.route_label?.trim();
  const dest =
    (routeLabel
      ? [item.destination, routeLabel].filter(Boolean).join(" · ")
      : [item.destination, item.city].filter(Boolean).join(" · ")) || dash;
  const cityOnly =
    routeLabel ||
    item.city?.trim() ||
    item.destination?.split(/[·,，]/)[0]?.trim() ||
    "";
  const days = item.days != null ? t("market_daysShort").replace("{{n}}", String(item.days)) : "";
  const statusSlice = item.status || item.state;
  const statusKey = statusSlice
    ? orderStateToStatusLabelKey({
        state: item.state,
        status: item.status,
        sub_status: item.sub_status,
      })
    : "order_status_draft";
  const statusLabel = statusSlice ? (t(statusKey) || statusSlice) : t("order_status_draft");
  const statusRaw = (item.status ?? item.state ?? "").toLowerCase();
  const isDraftLike = statusRaw === "draft";
  /** Reality Audit B1-G-005: Draft + Escrow ✓ co-badge reads as already escrowed — hide on draft. */
  const showEscrowCapabilityBadge =
    !isDraftLike &&
    (Boolean(item.escrow_address?.trim()) ||
      statusRaw === "created" ||
      statusRaw === "open" ||
      statusRaw === "accepted" ||
      statusRaw === "escrowed" ||
      statusRaw === "funded" ||
      statusRaw === "in_progress" ||
      statusRaw === "completed");
  /** 与 OrderDetailDrawer 接单 CTA 同源：created/open 可在市场抢单 */
  const isOpenMarket = statusRaw === "created" || statusRaw === "open";
  const isDevDemoOrder = isMarketDevVarietyOrderId(item.id);
  const showTestLabel = shouldShowMarketOrderDisplayTestLabel(item);
  const ownTouristId = useViewerUserId();
  const isOwnPublishedListing = isOwnPublishedOpenListing(item, ownTouristId);
  const isOwnBindingOrder =
    (Boolean(bindingOrderId?.trim()) && String(item.id) === String(bindingOrderId).trim()) ||
    isOwnPublishedListing;
  const guideAssignedOnBind = isOwnBindingOrder && marketOrderHasAssignedGuide(item);
  const canGrabOrder = !isDevDemoOrder && !isOwnBindingOrder && isOpenMarket;
  const statusVariant = statusSlice
    ? orderStateToBadgeVariant({
        state: item.state,
        status: item.status,
        sub_status: item.sub_status,
      })
    : "neutral";
  const statusOverlayClass = (() => {
    if (isOwnBindingOrder && isOrderPublishedToDiscover(statusRaw)) {
      return glass
        ? "bg-ref-sun/22 text-ref-sun border border-ref-sun/38 shadow-[0_2px_8px_-6px_rgba(0,0,0,0.55)]"
        : "bg-ref-sun/15 text-ink-900 border border-ref-sun/35";
    }
    switch (statusVariant) {
      case "success":
        return "bg-success/90 text-white";
      case "danger":
        return "bg-danger/90 text-white";
      case "warning":
        return "bg-warning/90 text-white";
      default:
        if (glass && isDraftLike) {
          return "bg-ink-900/80 text-slate-300 border border-ref-sun/24 shadow-[0_2px_8px_-6px_rgba(0,0,0,0.55)]";
        }
        return glass
          ? "bg-ink-900/70 text-slate-200 border border-ref-sun/20"
          : "bg-ink-800/90 text-white";
    }
  })();
  const imageAlt = dest !== dash ? t("order_imageAlt").replace("{{dest}}", dest) : t("order_imageAltFallback");
  const teaser = isOwnBindingOrder
    ? guideAssignedOnBind
      ? t("market_own_binding_guide_selected_teaser")
      : isOrderPublishedToDiscover(statusRaw)
        ? t("market_own_binding_order_teaser")
        : t("market_own_binding_draft_teaser")
    : resolveMarketOrderCardTeaser(item, t) ??
      (isOpenMarket ? null : isDraftLike ? t("market_order_draft_teaser") : null);
  const openDetail = onViewDetail ? () => onViewDetail(item.id) : undefined;

  const p = TT_MARKETING_MARKET_DARK_PATH;
  const articleClass = glass
    ? `${TT_MARKETING_MARKET_L5_LIST_CARD_FRAME} ${openDetail ? p.cardInteractive : ""} group${
        isSelectedBindingTarget ? " ring-2 ring-ref-sun/55 ring-offset-2 ring-offset-ink-950" : ""
      }`
    : "group rounded-[var(--radius-md)] border border-ink-200 bg-bg-console/95 backdrop-blur-sm shadow-soft overflow-hidden motion-sub transition-[transform,box-shadow] hover:-translate-y-1 hover:shadow-strong";
  const contentClass = glass ? `${p.cardBodyPadding} ${p.cardContentDivider}` : "p-4 space-y-3 bg-bg-console/95 backdrop-blur-sm";
  const titleClass = glass ? "text-body font-semibold text-white line-clamp-2" : "text-body font-semibold text-ink-900 line-clamp-2";
  const subClass = glass ? "text-meta text-white/75 mt-0.5 line-clamp-2" : "text-meta text-ink-500 mt-0.5";
  const priceClass = glass ? "text-h4 font-semibold text-white tracking-tight" : "text-h4 font-semibold text-ink-900 tracking-tight";
  const metaClass = glass ? "text-meta text-ref-sun/80" : "text-meta text-ink-500";
  const listClass = glass ? "text-small text-white/85 space-y-0.5" : "text-small text-ink-600 space-y-0.5";
  const borderClass = glass ? p.cardContentDivider : "border-t border-ink-100";
  const btnSecClass = glass
    ? p.cardViewItineraryLink
    : `btn-console rounded-[var(--radius-sm)] border border-ink-300 px-3 py-1.5 text-ink-700 text-small ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`;
  const btnGrabClass = glass
    ? `${touchTargetLink44Classes} ${TT_MARKETING_BTN_MARKET_PRIMARY}`
    : `btn-console rounded-[var(--radius-sm)] bg-travel-500 px-3 py-1.5 text-white text-small font-medium ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`;
  const btnPayHubClass = glass
    ? p.cardPayHubBtn
    : `btn-console rounded-[var(--radius-sm)] border border-travel-500/50 bg-travel-500/5 px-3 py-1.5 text-travel-600 text-small font-medium ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`;
  const favBtnClass = glass
    ? p.cardFavBtn
    : `inline-flex min-h-[44px] min-w-[44px] h-11 w-11 items-center justify-center rounded-full bg-bg-console shadow-soft hover:bg-bg-soft transition-colors border border-ink-200 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`;
  const stashMarketCardEscrowPayPrefetch = () => stashEscrowOrderPrefetchFromMarketCard(item);

  const stopCardBubble = (e: MouseEvent) => e.stopPropagation();

  const cardBody = (
    <>
      <div className="relative">
        <MarketOrderCover
          item={item}
          glass={glass}
          coverEager={coverEager}
          imageAlt={imageAlt}
          destLabel={dest}
          cityLabel={cityOnly}
          daysLabel={days}
          amountLabel=""
          statusLabel={statusLabel}
          statusOverlayClass={statusOverlayClass}
          coverFooterExtra={
            glass ? (
              <div className="flex flex-wrap items-center gap-1.5">
                {showTestLabel ? <MarketDisplayTestBadge glass /> : null}
                {isOwnBindingOrder ? (
                  <span className={p.cardCoverChip}>
                    {guideAssignedOnBind
                      ? t("market_own_binding_guide_selected_badge")
                      : t("market_own_binding_order_badge")}
                  </span>
                ) : null}
                {showEscrowCapabilityBadge ? <EscrowEnabledBadge variant="cover" /> : null}
              </div>
            ) : null
          }
        />
        {onToggleFavorite ? (
          <div className="absolute top-2 right-2 z-10" onClick={stopCardBubble}>
            <form
              className="inline shrink-0"
              onSubmit={(e) => {
                e.preventDefault();
                onToggleFavorite(item.id);
              }}
            >
              <button
                type="submit"
                className={favBtnClass}
                aria-label={isFavorited ? t("empty_unfavoriteAria") : t("empty_favoriteAria")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className={isFavorited ? "text-danger" : glass ? "text-white/80" : "text-ink-500"} aria-hidden>
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </form>
          </div>
        ) : null}
      </div>

      <div className={contentClass} onClick={stopCardBubble}>
        <div>
          <h3 id={`order-title-${item.id}`} className={`${titleClass} flex flex-wrap items-center gap-2`}>
            <span className="min-w-0">
              {dest}
              {!glass && days ? ` · ${days}` : ""}
            </span>
            {!glass && showTestLabel ? <MarketDisplayTestBadge /> : null}
          </h3>
          <p className={subClass}>
            {isDevDemoOrder ? t("market_dev_demo_teaser") : null}
            {!isDevDemoOrder && isOwnBindingOrder ? teaser : null}
            {!isDevDemoOrder && !isOwnBindingOrder && teaser ? (
              <UgcTranslatedText
                as="span"
                policy="cache_first"
                contentClass="itinerary"
                contentId={item.id}
                field="teaser"
                originalText={teaser}
              />
            ) : null}
            {!isDevDemoOrder && !isOwnBindingOrder && !teaser
              ? days
                ? t("order_daysItinerary").replace("{{n}}", String(item.days))
                : t("order_itinerary")
              : null}
            {item.headcount != null && item.headcount > 0
              ? t("order_headcountUnit").replace("{{n}}", String(item.headcount))
              : ""}
          </p>
        </div>
        {glass ? (
          <p className={priceClass}>
            {item.amount ?? dash} {settledCurrency}
          </p>
        ) : (
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className={priceClass}>
              {item.amount ?? dash} {settledCurrency}
            </p>
          </div>
        )}
        {!glass ? (
          <>
            <p className={metaClass}>{t("order_escrowPricing")}</p>
            <ul className={listClass}>
              <li>
                · {t("order_destLabel")}
                {dest}
              </li>
              {item.days != null && (
                <li>
                  · {t("order_itineraryLabel")}
                  {item.days}
                  {t("order_dayUnit")}
                </li>
              )}
              <li>· {t("order_escrowReady")}</li>
            </ul>
          </>
        ) : null}
        <div className={`flex flex-wrap items-center gap-2 sm:gap-3 ${glass ? `${p.cardActionRow} ${borderClass}` : `pt-1 ${borderClass}`}`}>
          {onGrabOrder && canGrabOrder && (
            <form
              className="inline"
              onSubmit={(e) => {
                e.preventDefault();
                onGrabOrder(item.id);
              }}
            >
              <button
                type="submit"
                className={btnGrabClass}
                aria-label={`${t("order_cta_grab")} — ${dest}`}
              >
                {t("order_cta_grab")}
              </button>
            </form>
          )}
          {isOwnBindingOrder ? (
            <>
              <a
                href="#market-guides-section"
                onClick={stopCardBubble}
                className={`${touchTargetLink44Classes} ${btnGrabClass}`}
              >
                {t("market_own_order_cta_pick_guide")}
              </a>
              <Link
                href={`/escrow/${encodeURIComponent(item.id)}`}
                onClick={(e) => {
                  stopCardBubble(e);
                  stashMarketCardEscrowPayPrefetch();
                }}
                className={`${touchTargetLink44Classes} ${btnSecClass}`}
                data-tt-market-card-own-escrow="1"
              >
                {t("market_own_binding_back_escrow")}
              </Link>
            </>
          ) : onViewDetail ? (
            <button
              type="button"
              className={`${touchTargetLink44Classes} ${btnSecClass}`}
              onClick={(e) => {
                e.stopPropagation();
                onViewDetail(item.id);
              }}
            >
              {t("order_cta_viewItinerary")}
            </button>
          ) : (
            <span className={`${touchTargetLink44Classes} ${btnSecClass} opacity-60 pointer-events-none`} aria-disabled>
              {t("order_cta_viewItinerary")}
            </span>
          )}
          {isOwnBindingOrder && orderLikeMayOnchainDeposit(item) && (
            <Link
              href={`/pay?orderId=${encodeURIComponent(item.id)}`}
              onClick={stashMarketCardEscrowPayPrefetch}
              className={`${touchTargetLink44Classes} ${btnPayHubClass}`}
              data-tt-market-card-own-pay="1"
            >
              {t("orders_payHub")}
            </Link>
          )}
        </div>
      </div>
    </>
  );

  return (
    <article
      className={articleClass}
      aria-labelledby={`order-title-${item.id}`}
      onClick={openDetail}
      onKeyDown={
        openDetail
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openDetail();
              }
            }
          : undefined
      }
      role={openDetail ? "button" : undefined}
      tabIndex={openDetail ? 0 : undefined}
    >
      {glass ? <div className={TT_MARKETING_MARKET_L5_LIST_CARD_INNER}>{cardBody}</div> : cardBody}
    </article>
  );
});
