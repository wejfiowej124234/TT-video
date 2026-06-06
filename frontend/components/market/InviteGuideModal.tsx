"use client";

import { useEffect, useId } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import type { GuideCardItem } from "./GuideCard";
import { stashEscrowOrderPrefetchForOrderIdNav } from "@/lib/orderEscrowPrefetch";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";
import MarketGlassModalFrame from "@/components/market/MarketGlassModalFrame";
import {
  marketStudioModalChromeBodyScroll,
  marketStudioModalChromeHeaderRow,
} from "@/components/market/marketStudioModalLayout";

/** P29 邀请向导弹窗：选择向导后发邀请（占位：实际发邀请/创建会话待接 API）。企业级：焦点陷阱、body 滚动锁、Esc、遮罩点击关闭、aria。 */
export default function InviteGuideModal({
  orderId,
  guides,
  onSelect,
  onClose,
}: {
  orderId: string;
  guides: GuideCardItem[];
  onSelect: (guideId: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const trapRef = useFocusTrap(true, onClose);
  const titleId = useId();
  const descId = useId();
  const p = TT_MARKETING_MARKET_DARK_PATH;
  const orderTrimmed = orderId.trim();
  const orderMissing = !orderTrimmed;

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const footerLinkClass = orderMissing
    ? `${touchTargetLink44Classes} text-slate-500 pointer-events-none opacity-50`
    : `${touchTargetLink44Classes} ${p.emptyCrossNavLink}`;

  return (
    <MarketGlassModalFrame
      onRequestClose={onClose}
      panelRef={trapRef}
      aria-labelledby={titleId}
      aria-describedby={descId}
      panelClassName="max-w-md max-h-[80vh] flex flex-col"
      panelHtmlProps={{ "data-testid": "invite-guide-modal" }}
    >
      <div className={marketStudioModalChromeHeaderRow}>
        <h2 id={titleId} className="text-body font-semibold text-slate-100 min-w-0 flex-1">
          {t("invite_guide_title")}
        </h2>
        <form
          className="inline shrink-0"
          onSubmit={(e) => {
            e.preventDefault();
            onClose();
          }}
        >
          <button type="submit" className={p.studioCloseBtn} aria-label={t("invite_guide_close")}>
            ✕
          </button>
        </form>
      </div>
      <div id={descId} className={`${marketStudioModalChromeBodyScroll} flex-1 min-h-0`}>
        {orderMissing ? (
          <p className="text-small text-ref-sun/90 mb-3">{t("invite_guide_missing_order_id")}</p>
        ) : null}
        <p className="text-small text-slate-300 mb-3">{t("invite_guide_desc")}</p>
        {guides.length === 0 ? (
          <p className="text-small text-slate-400">{t("invite_guide_noGuides")}</p>
        ) : (
          <ul className="space-y-2">
            {guides.map((g) => (
              <li key={g.id}>
                <form
                  className="block w-full"
                  onSubmit={(e) => {
                    e.preventDefault();
                    onSelect(g.id);
                  }}
                >
                  <button
                    type="submit"
                    className={`flex min-h-[44px] w-full items-center justify-start text-left rounded-[var(--radius-sm)] border px-3 py-2 text-small ${p.studioChipIdle} ${p.filterChipFocusGlass}`}
                  >
                    <span className="font-medium text-slate-100">{g.city ?? t("view_guides")}</span>
                    <span className="text-slate-400 ml-2">
                      {Array.isArray(g.languages) ? g.languages.slice(0, 2).join(" / ") : ""}
                    </span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className={`${p.studioFooter} px-6 py-4 flex flex-wrap gap-x-4 gap-y-1 text-meta`}>
        <Link
          href={orderMissing ? "#" : `/escrow/${encodeURIComponent(orderTrimmed)}`}
          onClick={(e) => {
            if (orderMissing) {
              e.preventDefault();
              return;
            }
            stashEscrowOrderPrefetchForOrderIdNav(orderTrimmed, "escrow");
          }}
          className={footerLinkClass}
          aria-disabled={orderMissing ? "true" : undefined}
        >
          {t("orders_viewDetail")}
        </Link>
        <Link
          href={orderMissing ? "#" : `/pay?orderId=${encodeURIComponent(orderTrimmed)}`}
          onClick={(e) => {
            if (orderMissing) {
              e.preventDefault();
              return;
            }
            stashEscrowOrderPrefetchForOrderIdNav(orderTrimmed, "pay");
          }}
          className={footerLinkClass}
          aria-disabled={orderMissing ? "true" : undefined}
        >
          {t("orders_payHub")}
        </Link>
      </div>
    </MarketGlassModalFrame>
  );
}
