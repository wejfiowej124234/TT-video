"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { TT_LANDING_CHROME_CLASS } from "@/lib/traveltrustHeroLayout";
import { TravelTrustCinematicLowQualityToggle } from "./TravelTrustCinematicLowQualityToggle";
import { TravelTrustLandingNav } from "./TravelTrustLandingNav";
import { useTravelTrustHeroScrollProgress } from "./TravelTrustHeroScrollContext";

const TravelTrustPulseTicker = dynamic(
  () =>
    import("./TravelTrustPulseTicker").then((m) => ({
      default: m.TravelTrustPulseTicker,
    })),
  { ssr: true, loading: () => <div className="h-8 max-h-9 sm:h-9" aria-hidden /> },
);

/**
 * 首屏：公告条 + 章节 nav + 画质；滚出 hero 后 PULSE 加宽（TT-PH1-155 · ①）
 */
export function TravelTrustLandingChrome() {
  const heroScroll = useTravelTrustHeroScrollProgress();
  const [showPulseExpanded, setShowPulseExpanded] = useState(false);

  useEffect(() => {
    if (!heroScroll) return;
    const update = (t: number) => setShowPulseExpanded(t >= 0.12);
    update(heroScroll.get());
    return heroScroll.on("change", update);
  }, [heroScroll]);

  return (
    <motion.div
      className={TT_LANDING_CHROME_CLASS}
      data-tt-traveltrust-landing-chrome="1"
      data-tt-traveltrust-landing-chrome-pulse-expanded={showPulseExpanded ? "1" : "0"}
    >
      <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-2 pb-1 pt-1 sm:gap-4 sm:pb-1.5 sm:pt-1.5">
        <motion.div
          className={`order-2 min-w-0 w-full sm:order-1 ${
            showPulseExpanded
              ? "sm:max-w-[min(100%,30rem)] sm:flex-[1.2]"
              : "sm:max-w-[min(100%,24rem)] sm:flex-[1.05]"
          }`}
          layout
          transition={{ duration: 0.35 }}
        >
          <TravelTrustPulseTicker variant="inline" />
        </motion.div>
        <motion.div className="order-1 flex min-w-0 shrink-0 items-center gap-2 overflow-visible sm:order-2 sm:ml-auto sm:gap-3">
          <TravelTrustLandingNav embedded compactOnHero />
          <TravelTrustCinematicLowQualityToggle compact={!showPulseExpanded} />
        </motion.div>
      </div>
    </motion.div>
  );
}
