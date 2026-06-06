"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { TravelTrustCinematicLowQualityToggle } from "./TravelTrustCinematicLowQualityToggle";
import { TravelTrustLandingNav } from "./TravelTrustLandingNav";
import { TravelTrustPageBriefModeBadge } from "./TravelTrustPageBriefModeBadge";
import { TravelTrustPulseTicker } from "./TravelTrustPulseTicker";
import { useTravelTrustHeroScrollProgress } from "./TravelTrustHeroScrollContext";
import {
  TT_LANDING_CHROME_L5,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrust/l5";

/**
 * 首屏薄 HUD · 双行常驻
 * 上行 LIVE + 章节 nav · 下行「项目动态」全宽（勿与 toolbar 抢 flex 宽）
 */
export function TravelTrustLandingChrome() {
  const { t } = useTranslation();
  const heroScroll = useTravelTrustHeroScrollProgress();
  const [heroT, setHeroT] = useState(0);

  useEffect(() => {
    if (!heroScroll) return;
    const update = (t: number) => setHeroT(t);
    update(heroScroll.get());
    return heroScroll.on("change", update);
  }, [heroScroll]);

  const bottomBorderAlpha = Math.min(1, heroT * 1.4) * TT_LANDING_CHROME_L5.bottomBorderPeak;
  const heroBgAlpha = (heroT * TT_LANDING_CHROME_L5.heroTBackgroundPeak).toFixed(3);

  return (
    <div
      className={TT_LANDING_CHROME_L5.shellClass}
      data-tt-traveltrust-landing-chrome="1"
      data-tt-traveltrust-landing-chrome-pulse-expanded="1"
      data-tt-traveltrust-landing-chrome-l1-panel="both"
      data-tt-traveltrust-landing-chrome-hero-t={heroT.toFixed(2)}
      data-tt-traveltrust-landing-chrome-l5="1"
      data-tt-traveltrust-landing-chrome-slim-l5="1"
      data-tt-traveltrust-landing-chrome-merged-header-l5="1"
      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
      style={{
        borderBottomWidth: 1,
        borderBottomStyle: "solid",
        borderBottomColor: `rgba(252, 164, 124, ${bottomBorderAlpha.toFixed(3)})`,
        background: `linear-gradient(180deg, rgba(252,164,124,${heroBgAlpha}) 0%, transparent 72%)`,
      }}
    >
      <div
        className="flex w-full flex-col gap-0.5 px-0 py-0.5 sm:gap-1 sm:py-1"
        data-tt-traveltrust-landing-chrome-layout="stacked-dual-row-l5"
      >
        <div
          className={`${TT_LANDING_CHROME_L5.controlsToolbarClass} w-full`}
          data-tt-traveltrust-landing-chrome-toolbar-l5="1"
          data-tt-traveltrust-landing-chrome-live-row-l5="1"
          role="group"
          aria-label={t("traveltrust_landing_chrome_toolbar_aria")}
        >
          <div
            className={TT_LANDING_CHROME_L5.liveSlotClass}
            data-tt-traveltrust-landing-chrome-live-slot-l5="1"
            aria-label={t("traveltrust_landing_chrome_live_slot_aria")}
          >
            <TravelTrustPageBriefModeBadge compact />
          </div>
          <div
            className={TT_LANDING_CHROME_L5.navSlotClass}
            data-tt-traveltrust-landing-chrome-nav-slot-l5="1"
          >
            <TravelTrustLandingNav embedded compactOnHero />
          </div>
          <div
            className={TT_LANDING_CHROME_L5.toolbarToggleSlotClass}
            data-tt-traveltrust-landing-chrome-toggle-slot-l5="1"
          >
            <TravelTrustCinematicLowQualityToggle compact />
          </div>
        </div>
        <div
          className={`${TT_LANDING_CHROME_L5.pulseSlotClass} ${TT_LANDING_CHROME_L5.pulseRowDividerClass} w-full`}
          data-tt-traveltrust-landing-chrome-pulse-row-l5="1"
          data-tt-traveltrust-landing-chrome-pulse-expanded="1"
        >
          <TravelTrustPulseTicker variant="inline" />
        </div>
      </div>
    </div>
  );
}
