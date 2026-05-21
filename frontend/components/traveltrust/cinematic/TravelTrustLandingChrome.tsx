"use client";

import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { TravelTrustCinematicLowQualityToggle } from "./TravelTrustCinematicLowQualityToggle";
import { TravelTrustLandingNav } from "./TravelTrustLandingNav";
import { TravelTrustPageBriefModeBadge } from "./TravelTrustPageBriefModeBadge";
import { useTravelTrustHeroScrollProgress } from "./TravelTrustHeroScrollContext";
import {
  TT_LANDING_CHROME_L5,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrustCinematicNonGlobeL5";

const TravelTrustPulseTicker = dynamic(
  () =>
    import("./TravelTrustPulseTicker").then((m) => ({
      default: m.TravelTrustPulseTicker,
    })),
  {
    ssr: true,
    loading: () => (
      <motion.div className="min-h-[2rem]" aria-hidden data-tt-traveltrust-pulse-slot-skeleton="1" />
    ),
  },
);

/**
 * 首屏：薄 HUD — 上行章节 nav + LIVE，下行项目动态（无大圆角空盒 · TT-PH1-155）
 */
export function TravelTrustLandingChrome() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const heroScroll = useTravelTrustHeroScrollProgress();
  const [showPulseExpanded, setShowPulseExpanded] = useState(false);
  const [heroT, setHeroT] = useState(0);

  useEffect(() => {
    if (!heroScroll) return;
    const update = (t: number) => {
      setHeroT(t);
      setShowPulseExpanded(t >= 0.12);
    };
    update(heroScroll.get());
    return heroScroll.on("change", update);
  }, [heroScroll]);

  const navScrim = Math.min(1, heroT * 1.4);
  const bottomBorderAlpha = navScrim * TT_LANDING_CHROME_L5.bottomBorderPeak;

  return (
    <motion.div
      className={TT_LANDING_CHROME_L5.shellClass}
      data-tt-traveltrust-landing-chrome="1"
      data-tt-traveltrust-landing-chrome-pulse-expanded={showPulseExpanded ? "1" : "0"}
      data-tt-traveltrust-landing-chrome-hero-t={heroT.toFixed(2)}
      data-tt-traveltrust-landing-chrome-l5="1"
      data-tt-traveltrust-landing-chrome-slim-l5="1"
      data-tt-traveltrust-landing-chrome-merged-header-l5="1"
      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
      animate={{
        background: `linear-gradient(180deg, rgba(252,164,124,${(heroT * TT_LANDING_CHROME_L5.heroTBackgroundPeak).toFixed(3)}) 0%, transparent 72%)`,
        borderBottomColor: `rgba(252, 164, 124, ${bottomBorderAlpha.toFixed(3)})`,
      }}
      transition={TT_LANDING_CHROME_L5.heroTTransition}
      style={{ borderBottomWidth: 1, borderBottomStyle: "solid" }}
    >
      {!reduceMotion ? (
        <motion.span
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-ref-sun/55 to-transparent"
          aria-hidden
          data-tt-traveltrust-landing-chrome-border-shimmer-l5="1"
          animate={{ x: ["-25%", "125%"], opacity: [0.35, 0.85, 0.35] }}
          transition={{
            x: { duration: TT_LANDING_CHROME_L5.bottomShimmerDuration, repeat: TT_LANDING_CHROME_L5.bottomShimmerRepeat, ease: "easeInOut" },
            opacity: { duration: TT_LANDING_CHROME_L5.bottomShimmerDuration, repeat: TT_LANDING_CHROME_L5.bottomShimmerRepeat, ease: "easeInOut" },
          }}
        />
      ) : null}
      <motion.div
        className={TT_LANDING_CHROME_L5.chromeRowClass}
        data-tt-traveltrust-landing-chrome-layout="stacked-l5"
        data-tt-traveltrust-landing-chrome-xl-single-row-l5="0"
      >
        <motion.div
          className={TT_LANDING_CHROME_L5.controlsToolbarClass}
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
          {heroT >= 0.14 || showPulseExpanded ? (
            <div
              className={TT_LANDING_CHROME_L5.toolbarToggleSlotClass}
              data-tt-traveltrust-landing-chrome-toggle-slot-l5="1"
            >
              <TravelTrustCinematicLowQualityToggle compact={!showPulseExpanded} />
            </div>
          ) : null}
        </motion.div>
        <motion.div
          className={`${TT_LANDING_CHROME_L5.pulseSlotClass} ${TT_LANDING_CHROME_L5.pulseRowDividerClass}`}
          data-tt-traveltrust-landing-chrome-pulse-row-l5="1"
          data-tt-traveltrust-landing-chrome-pulse-expanded={showPulseExpanded ? "1" : "0"}
          layout
          transition={TT_LANDING_CHROME_L5.pulseLayoutSpring}
        >
          <TravelTrustPulseTicker variant="inline" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
