"use client";

import { memo } from "react";
import LandingFooter from "@/components/landing/LandingFooter";
import { TT_MARKETING_HOME_FOOTER_TOP_FADE } from "@/lib/marketingUi";

/** `/market` L5 页脚 · 与 `/` 同源 `LandingFooter`（MARKET-UI-THAW 2026-05-29） */
function MarketPageFooter() {
  return (
    <div className="relative mt-12">
      <div className={TT_MARKETING_HOME_FOOTER_TOP_FADE} aria-hidden />
      <LandingFooter />
    </div>
  );
}

export default memo(MarketPageFooter);
