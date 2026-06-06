"use client";

import { useTranslation } from "@/components/LocaleProvider";
import MarketAmbientBackdrop from "@/components/market/MarketAmbientBackdrop";
import { TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";

const D = TT_MARKETING_MARKET_DARK_PATH;

/** 29 自由市场：与主列表页同背景与玻璃态，减少路由切换闪烁（51-31-25 / 52 可感知加载） */
export default function MarketLoading() {
  const { t } = useTranslation();
  return (
    <main className="relative min-h-screen" role="status" aria-label={t("market_hero_title")} aria-busy="true">
      <MarketAmbientBackdrop />
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-20">
        <div className={D.marketLoadingShell}>
          <div className={`min-h-[44px] h-11 w-3/4 max-w-[14rem] ${D.marketLoadingSkeleton}`} aria-hidden />
          <div className={`h-4 w-full max-w-sm ${D.marketLoadingSkeleton}`} aria-hidden />
          <div className={`h-4 max-w-[10rem] ${D.marketLoadingSkeleton}`} aria-hidden />
          <div className="flex flex-wrap gap-2 pt-2">
            <div className={`min-h-[44px] h-11 w-24 ${D.marketLoadingSkeleton}`} aria-hidden />
            <div className={`min-h-[44px] h-11 w-24 ${D.marketLoadingSkeleton}`} aria-hidden />
            <div className={`min-h-[44px] h-11 w-28 ${D.marketLoadingSkeleton}`} aria-hidden />
          </div>
        </div>
        <p className="mt-6 text-small text-white/90 motion-sub animate-pulse" aria-live="polite">
          {t("common_loading")}
        </p>
      </div>
    </main>
  );
}
