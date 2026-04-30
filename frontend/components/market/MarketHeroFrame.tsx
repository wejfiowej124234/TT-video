import type { ReactNode } from "react";

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
  const shell = isSub
    ? "border border-white/10 bg-ink-900/55 shadow-[0_20px_56px_-28px_rgba(0,0,0,0.55)] ring-1 ring-white/[0.04]"
    : "border border-white/18 bg-white/[0.07] shadow-[0_0_52px_-14px_rgba(252,164,124,0.14),0_0_40px_-10px_rgba(35,206,217,0.12)] ring-1 ring-ref-coral/20 backdrop-blur-md";
  const wash = isSub
    ? "bg-[radial-gradient(ellipse_85%_55%_at_50%_-15%,rgba(34,211,238,0.09),transparent_52%),radial-gradient(ellipse_60%_40%_at_100%_0%,rgba(15,23,42,0.5),transparent_45%)]"
    : "bg-[radial-gradient(ellipse_90%_75%_at_50%_-30%,rgba(249,215,121,0.2),transparent_52%),radial-gradient(ellipse_70%_55%_at_8%_40%,rgba(252,164,124,0.16),transparent_50%),radial-gradient(circle_at_95%_35%,rgba(35,206,217,0.12),transparent_42%)]";

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

/** 主市场「创建行程」类主 CTA 的高亮渐变样式（历史名保留；与 `market_customItinerary` 文案对齐）。 */
export const marketHeroCustomItineraryCtaClassName =
  "inline-flex min-h-[44px] items-center justify-center rounded-full bg-gradient-to-r from-ref-teal via-ref-cyan to-ref-teal px-5 py-2.5 text-small font-semibold text-white shadow-[0_0_28px_-4px_rgba(252,164,124,0.35),0_0_20px_-6px_rgba(35,206,217,0.3)] hover:brightness-110 motion-safe:transition-transform motion-safe:active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-coral/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(20,12,10,0.55)]";

/** 子站 / 旅行预约 Hero 工具条主按钮：与三入口同条，略收敛光晕。 */
export const marketSubsiteToolbarCustomLinkClassName =
  "inline-flex min-h-[44px] w-full min-w-[8.5rem] items-center justify-center rounded-xl border border-ref-cyan/35 bg-gradient-to-b from-ref-cyan/20 to-ref-teal/15 px-5 py-2.5 text-small font-semibold text-white shadow-[0_0_24px_-10px_rgba(35,206,217,0.35)] hover:from-ref-cyan/30 hover:to-ref-teal/25 motion-safe:transition-colors motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 sm:w-auto";
