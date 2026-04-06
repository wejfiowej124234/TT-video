"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import EscrowEnabledBadge from "@/components/trust/EscrowEnabledBadge";
import SupportedTokensPill from "@/components/trust/SupportedTokensPill";
import { useTranslation } from "@/components/LocaleProvider";
import { orderLikeMayOnchainDeposit } from "@/components/escrow/EscrowDetail/escrowOnChainEligibility";
import { shortEvmAddress } from "@/lib/formatEvmAddress";
import type { OrderCardItem, OrderBreakdown, TransportLeg } from "@/lib/marketTypes";
import { stashEscrowOrderPrefetchFromMarketCard } from "@/lib/orderEscrowPrefetch";
import { orderStateToBadgeVariant, orderStateToStatusLabelKey } from "@/lib/orderStatusI18n";
import { touchTargetLink44Classes, travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";

/** P29 订单卡片：行程照片 + 收藏 + 抢订单/查看行程；28 玻璃态 + Web3 徽章 */
export type { OrderCardItem, OrderBreakdown, TransportLeg } from "@/lib/marketTypes";

export default function OrderCard({
  item,
  onGrabOrder,
  onViewDetail,
  isFavorited,
  onToggleFavorite,
  glass,
}: {
  item: OrderCardItem;
  onGrabOrder?: (id: string) => void;
  onViewDetail?: (id: string) => void;
  isFavorited?: boolean;
  onToggleFavorite?: (id: string) => void;
  glass?: boolean;
}) {
  const { t } = useTranslation();
  const dash = t("ui_em_dash");
  /** 与主价行一致：拆分明细与 `item.currency` / 默认结算代币对齐，避免非 USDC 订单仍显示「USDC」后缀 */
  const settledCurrency = (item.currency ?? t("order_defaultSettlementToken")).trim();
  const dest = [item.destination, item.city].filter(Boolean).join(" · ") || dash;
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
  const statusVariant = statusSlice
    ? orderStateToBadgeVariant({
        state: item.state,
        status: item.status,
        sub_status: item.sub_status,
      })
    : "neutral";
  const statusOverlayClass = (() => {
    switch (statusVariant) {
      case "success":
        return "bg-success/90 text-white";
      case "danger":
        return "bg-danger/90 text-white";
      case "warning":
        return "bg-warning/90 text-white";
      default:
        return glass ? "bg-black/75 text-white" : "bg-ink-800/90 text-white";
    }
  })();
  const imageUrl = item.image || null;
  const [coverLoadFailed, setCoverLoadFailed] = useState(false);
  useEffect(() => {
    setCoverLoadFailed(false);
  }, [imageUrl]);
  const showCoverImage = Boolean(imageUrl) && !coverLoadFailed;
  const imageAlt = dest !== dash ? t("order_imageAlt").replace("{{dest}}", dest) : t("order_imageAltFallback");

  const articleClass = glass
    ? "group rounded-[var(--radius-md)] border border-white/20 bg-white/[0.06] backdrop-blur-md backdrop-saturate-150 shadow-[0_8px_32px_-10px_rgba(0,0,0,0.55),0_0_28px_-8px_rgba(35,206,217,0.1)] ring-1 ring-ref-cyan/15 overflow-hidden motion-sub transition-[transform,box-shadow,background-color] hover:-translate-y-1 hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.5),0_0_32px_-6px_rgba(35,206,217,0.22)] hover:bg-white/10 hover:ring-ref-coral/25"
    : "group rounded-[var(--radius-md)] border border-ink-200 bg-bg-console/95 backdrop-blur-sm shadow-soft overflow-hidden motion-sub transition-[transform,box-shadow] hover:-translate-y-1 hover:shadow-strong";
  const contentClass = glass
    ? "p-4 space-y-3 bg-transparent backdrop-blur-sm border-t border-white/15"
    : "p-4 space-y-3 bg-bg-console/95 backdrop-blur-sm";
  const titleClass = glass ? "text-body font-semibold text-white line-clamp-2" : "text-body font-semibold text-ink-900 line-clamp-2";
  const subClass = glass ? "text-meta text-white/80 mt-0.5" : "text-meta text-ink-500 mt-0.5";
  const priceClass = glass ? "text-h4 font-semibold text-white tracking-tight" : "text-h4 font-semibold text-ink-900 tracking-tight";
  const metaClass = glass ? "text-meta text-white/75" : "text-meta text-ink-500";
  const listClass = glass ? "text-small text-white/85 space-y-0.5" : "text-small text-ink-600 space-y-0.5";
  const borderClass = glass ? "border-t border-white/15" : "border-t border-ink-100";
  const btnSecClass = glass
    ? "btn-console rounded-[var(--radius-sm)] border border-white/40 px-3 py-1.5 text-white text-small focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
    : `btn-console rounded-[var(--radius-sm)] border border-ink-300 px-3 py-1.5 text-ink-700 text-small ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`;
  const btnPayHubClass = glass
    ? "btn-console rounded-[var(--radius-sm)] border border-white/35 bg-white/10 px-3 py-1.5 text-white text-small font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
    : `btn-console rounded-[var(--radius-sm)] border border-travel-500/50 bg-travel-500/5 px-3 py-1.5 text-travel-600 text-small font-medium ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`;
  const placeholderClass = glass ? "text-white/70 text-body" : "text-ink-400 text-body";
  const favBtnClass = glass
    ? "inline-flex min-h-[44px] min-w-[44px] h-11 w-11 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm shadow-soft hover:bg-white/25 transition-colors border border-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
    : `inline-flex min-h-[44px] min-w-[44px] h-11 w-11 items-center justify-center rounded-full bg-bg-console shadow-soft hover:bg-bg-soft transition-colors border border-ink-200 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`;
  const stashMarketCardEscrowPayPrefetch = () => stashEscrowOrderPrefetchFromMarketCard(item);

  return (
    <article className={articleClass} aria-labelledby={`order-title-${item.id}`}>
      <div className="relative aspect-[4/3] bg-bg-soft overflow-hidden">
        {showCoverImage && imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
            sizes="(max-width: 768px) 100vw, 400px"
            unoptimized
            onError={() => setCoverLoadFailed(true)}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${placeholderClass}`}>{item.city || t("order_itinerary")}</div>
        )}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
          {onToggleFavorite && (
            <form
              className="inline"
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
          )}
          <EscrowEnabledBadge />
        </div>
        <div className="absolute top-2 left-2">
          <span
            className={`rounded-[var(--radius-sm)] px-2 py-0.5 text-meta font-medium shadow-medium ${statusOverlayClass}`}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      <div className={contentClass}>
        <div>
          <h3 id={`order-title-${item.id}`} className={titleClass}>{dest} {days ? `· ${days}` : ""}</h3>
          <p className={subClass}>{days ? t("order_daysItinerary").replace("{{n}}", String(item.days)) : t("order_itinerary")}{item.headcount != null && item.headcount > 0 ? t("order_headcountUnit").replace("{{n}}", String(item.headcount)) : ""}</p>
        </div>
        <div>
          <p className={priceClass}>
            {item.amount ?? dash} {settledCurrency}
          </p>
          <p className={metaClass}>{t("order_escrowPricing")}</p>
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          <SupportedTokensPill />
          <span className={metaClass}>{t("order_onChainPill")}</span>
        </div>
        <ul className={listClass}>
          <li>· {t("order_destLabel")}{dest}</li>
          {item.days != null && <li>· {t("order_itineraryLabel")}{item.days}{t("order_dayUnit")}</li>}
          {item.breakdown?.guideFee != null && (
            <li>
              · {t("order_guideFeeLabel")}
              {item.breakdown.guideFee} {settledCurrency}
            </li>
          )}
          {item.breakdown?.carFee != null && (
            <li>
              · {t("order_carFeeLabel")}
              {item.breakdown.carFee} {settledCurrency}
            </li>
          )}
          {item.escrow_address ? (
            <li className="font-mono text-[0.85em]" title={item.escrow_address}>
              · {t("escrow_contract")}
              {shortEvmAddress(item.escrow_address)}
            </li>
          ) : null}
          {Array.isArray(item.transportLegs) && item.transportLegs.length > 0 && (
            <li>· {item.transportLegs.map((leg) => {
              const typeStr = leg.type === "vehicle" ? t("market_transportVehicle") : leg.type === "rail" ? t("market_transportRail") : t("market_transportFlight");
              return t("order_transportLeg").replace("{{from}}", leg.from).replace("{{type}}", typeStr).replace("{{to}}", leg.to);
            }).join("；")}</li>
          )}
          <li>· {t("order_escrowReady")}</li>
        </ul>
        <div className={`flex flex-wrap gap-2 pt-1 ${borderClass}`}>
          {onGrabOrder && (
            <form
              className="inline"
              onSubmit={(e) => {
                e.preventDefault();
                onGrabOrder(item.id);
              }}
            >
              <button
                type="submit"
                className={`btn-console rounded-[var(--radius-sm)] bg-travel-500 px-3 py-1.5 text-white text-small font-medium ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
                aria-label={`${t("order_cta_grab")} — ${dest}`}
              >
                {t("order_cta_grab")}
              </button>
            </form>
          )}
          {onViewDetail ? (
            <form
              className="inline"
              onSubmit={(e) => {
                e.preventDefault();
                onViewDetail(item.id);
              }}
            >
              <button type="submit" className={btnSecClass}>
                {t("order_cta_viewItinerary")}
              </button>
            </form>
          ) : (
            <Link
              href={`/escrow/${encodeURIComponent(item.id)}`}
              onClick={stashMarketCardEscrowPayPrefetch}
              className={`${touchTargetLink44Classes} ${btnSecClass}`}
            >
              {t("order_cta_viewItinerary")}
            </Link>
          )}
          {orderLikeMayOnchainDeposit(item) && (
            <Link
              href={`/pay?orderId=${encodeURIComponent(item.id)}`}
              onClick={stashMarketCardEscrowPayPrefetch}
              className={`${touchTargetLink44Classes} ${btnPayHubClass}`}
            >
              {t("orders_payHub")}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
