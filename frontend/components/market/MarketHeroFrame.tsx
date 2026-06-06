import type { ReactNode } from "react";
import {
  TT_MARKETING_BTN_MARKET_PRIMARY_PILL,
  TT_MARKETING_BTN_MARKET_SUBSITE_TOOLBAR,
  TT_MARKETING_MARKET_DARK_PATH,
} from "@/lib/marketingUi";

export type MarketHeroFrameVariant = "default" | "subsite";

type Props = {
  children: ReactNode;
  /** `subsite`：更克制的边线与光晕；旅行预约与子站顶区共用。 */
  variant?: MarketHeroFrameVariant;
  /** `compact`：略减内边距，旅行预约首屏更高信息密度。 */
  padding?: "default" | "compact";
};

/** 主市场与子站顶区大框；`subsite` 为独立视觉，避免与主市场抢戏。 */
export default function MarketHeroFrame({ children, variant = "default", padding = "default" }: Props) {
  const isSub = variant === "subsite";
  const innerPad =
    padding === "compact" ? "px-4 py-3 sm:px-5 sm:py-4" : "px-4 py-5 sm:px-6 sm:py-6";
  const shell = isSub ? TT_MARKETING_MARKET_DARK_PATH.heroFrameSubsite : TT_MARKETING_MARKET_DARK_PATH.heroFrameDefault;
  const wash = isSub ? TT_MARKETING_MARKET_DARK_PATH.heroFrameSubsiteWash : TT_MARKETING_MARKET_DARK_PATH.heroFrameDefaultWash;

  const sectionPad = padding === "compact" ? "px-4 pt-3 pb-1.5 sm:pt-4 sm:pb-2" : "px-4 pt-5 pb-3 sm:pt-6 sm:pb-4";

  return (
    <section className={sectionPad}>
      <div className={`mx-auto max-w-5xl rounded-[var(--radius-lg)] overflow-hidden relative ${shell}`}>
        <div className={`pointer-events-none absolute inset-0 ${wash}`} aria-hidden />
        <div className={`relative ${innerPad} ${isSub ? "" : "backdrop-saturate-150 backdrop-blur-md"}`}>{children}</div>
      </div>
    </section>
  );
}

/** 主市场「创建行程」类主 CTA（SSOT：`marketingUi` · 与 `/` FAB 同族）。 */
export const marketHeroCustomItineraryCtaClassName = TT_MARKETING_BTN_MARKET_PRIMARY_PILL;

/** 子站 / 旅行预约 Hero 工具条主按钮。 */
export const marketSubsiteToolbarCustomLinkClassName = TT_MARKETING_BTN_MARKET_SUBSITE_TOOLBAR;
