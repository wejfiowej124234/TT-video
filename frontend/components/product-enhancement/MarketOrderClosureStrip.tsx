"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { trackPesCtaClick } from "@/lib/conversionAnalyticsLayer";
import { buildPesAuthHref } from "@/lib/pesAuthReturnFlow";
import { buildLoginReturnPathWithQuery } from "@/lib/marketLoginReturnPath";
import { PES_UI } from "@/lib/productEnhancementSprint";
import { usePesTouchpointImpression } from "@/lib/usePesAnalytics";
import { travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";

export type MarketOrderClosureStripProps = {
  t: (key: string) => string;
  className?: string;
};

/** Wave 4 · find_guide→order 收口：市场内订单入口 + Auth 回流 */
export function MarketOrderClosureStrip({ t, className = "" }: MarketOrderClosureStripProps) {
  usePesTouchpointImpression("market");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const marketReturn = useMemo(
    () => buildLoginReturnPathWithQuery(pathname, searchParams.toString(), "/market"),
    [pathname, searchParams],
  );
  const ordersHref = buildPesAuthHref("login", "/orders", "order", "/orders");
  const registerHref = buildPesAuthHref("register", marketReturn, "register", marketReturn);

  return (
    <aside
      className={`${PES_UI.conversionStrip} border-emerald-400/30 bg-emerald-500/8 ${className}`}
      aria-label={t("pes4_market_order_aria")}
      data-tt-pes-wave4="CC-P0-01"
      data-tt-pes-market-order-closure="1"
    >
      <div className="min-w-0 flex-1">
        <p className={PES_UI.conversionKicker}>{t("pes4_market_order_kicker")}</p>
        <p className={PES_UI.conversionBody}>{t("pes4_market_order_body")}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <span className={PES_UI.conversionBadge}>{t("pes2_escrow_badge")}</span>
        <Link
          href={ordersHref}
          onClick={() => trackPesCtaClick("market", ordersHref, "pes4_market_orders_cta")}
          className={`${PES_UI.ctaPrimary} ${travelFocusRingCoreOffset2Classes}`}
        >
          {t("pes4_market_order_cta")}
        </Link>
        <Link
          href={registerHref}
          onClick={() => trackPesCtaClick("market", registerHref, "pes4_market_register_cta")}
          className={`${PES_UI.ctaSecondary} ${travelFocusRingCoreOffset2Classes}`}
        >
          {t("pes4_market_register_cta")}
        </Link>
      </div>
    </aside>
  );
}
