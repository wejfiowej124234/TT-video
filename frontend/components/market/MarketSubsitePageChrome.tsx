"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import MarketAmbientBackdrop from "@/components/market/MarketAmbientBackdrop";
import MarketHeroFrame, { marketSubsiteToolbarCustomLinkClassName } from "@/components/market/MarketHeroFrame";
import MarketHeroNavToolbar from "@/components/market/MarketHeroNavToolbar";
import MarketHeroTrustPills from "@/components/market/MarketHeroTrustPills";
import MarketPageFooter from "@/components/market/MarketPageFooter";
import type { MarketListingDetailProvenance } from "@/lib/marketSubsiteDetailPageModel";
import { TT_MARKETING_MARKET_PAGE_H1 } from "@/lib/marketingUi";

type Props = {
  /** `aria-label` for `<main>` */
  mainLabel: string;
  "data-testid"?: string;
  /** SSR 详情页：与 `load*ListingPage` 的 `provenance` 同源，供 E2E / 观测（列表页勿传） */
  subsiteDetailAudit?: { variant: "provider" | "acquisition"; phase: MarketListingDetailProvenance };
  /** Hero 内主标题 */
  heroTitle: ReactNode;
  /** Hero 内副标题（详情页返回链等） */
  heroSubtitle?: ReactNode;
  /** 是否展示顶区一行信任说明（链上撮合 / Escrow / 争议） */
  showHeroTrustStrip?: boolean;
  /** 是否展示 Hero 下主工具条左侧 primary 槽位（默认 **返回旅行预约** `/market` 链；与子站「橱窗/收购工作台」分轨，避免 IA 漂移） */
  showHeroToolbarPrimary?: boolean;
  /** 覆盖主工具条 primary（如列表页的「橱窗/收购工作台」）；缺省为 `market_segment_back_travel` 链至 `/market` */
  customItineraryPrimary?: ReactNode;
  children: ReactNode;
};

/**
 * 商家 / 旅行收购子站：与旅行预约 `/market` 顶区同构（subsite 框 + 信任条 + 合并工具条）。
 */
export default function MarketSubsitePageChrome({
  mainLabel,
  "data-testid": testId,
  heroTitle,
  heroSubtitle,
  showHeroTrustStrip = true,
  showHeroToolbarPrimary = true,
  customItineraryPrimary,
  subsiteDetailAudit,
  children,
}: Props) {
  const { t } = useTranslation();

  return (
    <main
      className="relative min-h-screen"
      aria-label={mainLabel}
      data-testid={testId}
      data-tt-market-subsite-detail-root={subsiteDetailAudit ? "1" : undefined}
      data-tt-market-subsite-detail-variant={subsiteDetailAudit?.variant}
      data-tt-market-subsite-detail-phase={subsiteDetailAudit?.phase}
    >
      <MarketAmbientBackdrop />
      <div className="relative z-10 isolate min-h-screen">
        <MarketHeroFrame variant="subsite">
          <h1 className={TT_MARKETING_MARKET_PAGE_H1}>{heroTitle}</h1>
          {heroSubtitle ? (
            <div className="mt-2 text-center text-body text-slate-200/95 drop-shadow-market-body">{heroSubtitle}</div>
          ) : null}
          {showHeroTrustStrip ? <MarketHeroTrustPills /> : null}
          {showHeroToolbarPrimary ? (
            <MarketHeroNavToolbar
              primary={
                customItineraryPrimary ?? (
                  <Link href="/market" className={marketSubsiteToolbarCustomLinkClassName}>
                    {t("market_segment_back_travel")}
                  </Link>
                )
              }
            />
          ) : (
            <MarketHeroNavToolbar />
          )}
        </MarketHeroFrame>
        {children}
        <MarketPageFooter />
      </div>
    </main>
  );
}
