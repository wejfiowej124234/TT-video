"use client";

import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import type { TheaterViewportAnchor } from "./TravelTrustTheaterViewportContext";
import { TravelTrustSectionFilmDivider } from "./TravelTrustSectionFilmDivider";
import { TravelTrustSnapChapter } from "./TravelTrustSnapChapter";
import {
  TT_BELOW_FOLD_PLACEHOLDER_L5,
  TT_BELOW_FOLD_SCROLL_PLATE_L5,
  TT_BELOW_HERO_FADE_L5,
  TT_PAGE_SECTION_FLOW_L5,
  TT_SNAP_CHAPTER_GROUP_L5,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrustCinematicNonGlobeL5";
import { TT_Z, ttZClass } from "@/lib/traveltrustZ";

const TravelTrustIdentityTheater = dynamic(
  () =>
    import("./TravelTrustIdentityTheater").then((m) => ({
      default: m.TravelTrustIdentityTheater,
    })),
  { ssr: true, loading: () => <BelowFoldPlaceholder tall /> },
);

const TravelTrustStablecoinGateway = dynamic(
  () =>
    import("./TravelTrustStablecoinGateway").then((m) => ({
      default: m.TravelTrustStablecoinGateway,
    })),
  { ssr: true, loading: () => <BelowFoldPlaceholder /> },
);

const TravelTrustTrustFactsStrip = dynamic(
  () =>
    import("./TravelTrustTrustFactsStrip").then((m) => ({
      default: m.TravelTrustTrustFactsStrip,
    })),
  { ssr: true, loading: () => <BelowFoldPlaceholder /> },
);

const TravelTrustSettlementStrip = dynamic(
  () =>
    import("./TravelTrustSettlementStrip").then((m) => ({
      default: m.TravelTrustSettlementStrip,
    })),
  { ssr: true, loading: () => <BelowFoldPlaceholder /> },
);

const TravelTrustFaqStrip = dynamic(
  () => import("./TravelTrustFaqStrip").then((m) => ({ default: m.TravelTrustFaqStrip })),
  { ssr: true, loading: () => <BelowFoldPlaceholder /> },
);

const TravelTrustStartSection = dynamic(
  () =>
    import("./TravelTrustStartSection").then((m) => ({
      default: m.TravelTrustStartSection,
    })),
  { ssr: true, loading: () => <BelowFoldPlaceholder /> },
);

const TravelTrustNetworkFooter = dynamic(
  () =>
    import("./TravelTrustNetworkFooter").then((m) => ({
      default: m.TravelTrustNetworkFooter,
    })),
  { ssr: true, loading: () => <BelowFoldPlaceholder /> },
);

function BelowFoldPlaceholder({ tall = false }: { tall?: boolean }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={`${TT_BELOW_FOLD_PLACEHOLDER_L5.pulseClass} ${
        tall ? "min-h-[min(52vh,480px)]" : "min-h-[12rem]"
      }`}
      aria-hidden
      data-tt-traveltrust-below-fold-placeholder="1"
      data-tt-traveltrust-below-fold-placeholder-l5="1"
      data-tt-traveltrust-below-fold-placeholder-tall={tall ? "1" : "0"}
      animate={reduceMotion ? undefined : { opacity: [0.35, 0.55, 0.35] }}
      transition={
        reduceMotion
          ? undefined
          : {
              duration: TT_BELOW_FOLD_PLACEHOLDER_L5.pulseDuration,
              repeat: TT_BELOW_FOLD_PLACEHOLDER_L5.pulseRepeat,
              ease: "easeInOut",
            }
      }
    >
      {!reduceMotion ? (
        <>
          <motion.div
            className={TT_BELOW_FOLD_PLACEHOLDER_L5.warmCoreClass}
            aria-hidden
            data-tt-traveltrust-below-fold-placeholder-warm-core-l5="1"
            animate={{ opacity: TT_BELOW_FOLD_PLACEHOLDER_L5.warmCorePulse.opacity }}
            transition={{
              duration: TT_BELOW_FOLD_PLACEHOLDER_L5.warmCorePulse.duration,
              repeat: TT_BELOW_FOLD_PLACEHOLDER_L5.warmCorePulseRepeat,
              ease: "easeInOut",
            }}
          />
          <motion.span
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ref-sun/45 to-transparent"
            aria-hidden
            animate={{ x: ["-30%", "130%"] }}
            transition={{
              duration: TT_BELOW_FOLD_PLACEHOLDER_L5.shimmerDuration,
              repeat: TT_BELOW_FOLD_PLACEHOLDER_L5.shimmerRepeat,
              ease: "easeInOut",
            }}
          />
        </>
      ) : null}
    </motion.div>
  );
}

type Props = {
  onTheaterViewportChange?: (anchor: TheaterViewportAnchor | null) => void;
};

/** 首屏以下区块 code-split（L5 · TT-PH1-020 · ①） */
export function TravelTrustBelowFoldSections({ onTheaterViewportChange }: Props) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={`relative ${ttZClass(TT_Z.HERO_SKY)} isolate`}
      data-tt-traveltrust-below-fold-sections="1"
      data-tt-traveltrust-below-fold-sections-l5="1"
      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
    >
      <div
        className={TT_BELOW_FOLD_SCROLL_PLATE_L5.backdropClass}
        aria-hidden
        data-tt-traveltrust-below-fold-scroll-plate-l5="1"
      />
      <div
        className={`${TT_BELOW_HERO_FADE_L5.wrapperClass} ${TT_BELOW_HERO_FADE_L5.heightClass}`}
        style={{ background: TT_BELOW_HERO_FADE_L5.gradient }}
        aria-hidden
        data-tt-traveltrust-below-hero-ink-bridge-l5="1"
      />
      <motion.div className="relative z-[1]">
      <div
        className="pointer-events-none h-0 w-full overflow-hidden"
        aria-hidden
        data-tt-traveltrust-below-hero-fade="1"
        data-tt-traveltrust-below-hero-fade-l5="1"
        data-tt-traveltrust-below-hero-fade-disabled="1"
      />
      <TravelTrustSnapChapter chapterId="theater" align="center">
        <TravelTrustIdentityTheater onViewportChange={onTheaterViewportChange} />
      </TravelTrustSnapChapter>
      <TravelTrustSectionFilmDivider />
      <div
        className={TT_PAGE_SECTION_FLOW_L5.economyClusterClass}
        data-tt-traveltrust-economy-cluster="1"
        data-tt-traveltrust-scroll-chapter-beat="economy"
      >
        <div
          className={TT_PAGE_SECTION_FLOW_L5.economyClusterAtmosphereClass}
          aria-hidden
          data-tt-traveltrust-economy-cluster-atmosphere-l5="1"
        />
        <TravelTrustStablecoinGateway />
        <TravelTrustTrustFactsStrip />
        <TravelTrustSettlementStrip />
      </div>
      <TravelTrustSectionFilmDivider />
      <TravelTrustSnapChapter chapterId="faq" align="start">
        <TravelTrustFaqStrip />
      </TravelTrustSnapChapter>
      <TravelTrustSnapChapter chapterId="close" align="start">
        <div className={TT_SNAP_CHAPTER_GROUP_L5.innerStackClass}>
          <TravelTrustStartSection />
          <TravelTrustNetworkFooter grouped />
        </div>
      </TravelTrustSnapChapter>
      </motion.div>
    </motion.div>
  );
}
