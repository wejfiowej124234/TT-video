"use client";

import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { TravelTrustHomeBelowFoldShell } from "@/lib/traveltrust/home/BelowFoldSectionsShell";
import {
  TT_BELOW_FOLD_PLACEHOLDER_L5,
  TT_PAGE_SECTION_FLOW_L5,
  TT_SNAP_CHAPTER_GROUP_L5,
} from "@/lib/traveltrust/l5";
import type { TheaterViewportAnchor } from "./TravelTrustTheaterViewportContext";
import { TravelTrustSectionFilmDivider } from "./TravelTrustSectionFilmDivider";
import { TravelTrustSnapChapter } from "./TravelTrustSnapChapter";

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

const TravelTrustTtgUnlockSchedule = dynamic(
  () =>
    import("./TravelTrustTtgUnlockSchedule").then((m) => ({
      default: m.TravelTrustTtgUnlockSchedule,
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
            animate={{ opacity: [...TT_BELOW_FOLD_PLACEHOLDER_L5.warmCorePulse.opacity] }}
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

/**
 * Cinematic 层 Below-fold 编排（契约 / closure 扫描锚点）。
 * 外壳 SSOT：`TravelTrustHomeBelowFoldShell` · 线上 `TravelTrustHomeBelowFoldSection`。
 */
export function TravelTrustBelowFoldSections({ onTheaterViewportChange }: Props) {
  return (
    <TravelTrustHomeBelowFoldShell>
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
        <TravelTrustTrustFactsStrip />
        <TravelTrustSettlementStrip />
        <TravelTrustTtgUnlockSchedule />
        <TravelTrustStablecoinGateway />
      </div>
      <TravelTrustSectionFilmDivider />
      <TravelTrustSnapChapter chapterId="theater" align="center">
        <TravelTrustIdentityTheater onViewportChange={onTheaterViewportChange} />
      </TravelTrustSnapChapter>
      <TravelTrustSectionFilmDivider />
      <TravelTrustSnapChapter chapterId="close" align="start">
        <div className={TT_SNAP_CHAPTER_GROUP_L5.innerStackClass} id="start">
          <TravelTrustNetworkFooter grouped />
        </div>
      </TravelTrustSnapChapter>
    </TravelTrustHomeBelowFoldShell>
  );
}
