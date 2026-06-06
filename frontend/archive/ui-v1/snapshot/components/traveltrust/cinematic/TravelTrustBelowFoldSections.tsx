"use client";

import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import type { TheaterViewportAnchor } from "./TravelTrustTheaterViewportContext";
import { TravelTrustSectionFilmDivider } from "./TravelTrustSectionFilmDivider";

const TravelTrustIdentityTheater = dynamic(
  () =>
    import("./TravelTrustIdentityTheater").then((m) => ({
      default: m.TravelTrustIdentityTheater,
    })),
  { ssr: false, loading: () => <BelowFoldPlaceholder tall /> },
);

const TravelTrustStablecoinGateway = dynamic(
  () =>
    import("./TravelTrustStablecoinGateway").then((m) => ({
      default: m.TravelTrustStablecoinGateway,
    })),
  { ssr: true, loading: () => <BelowFoldPlaceholder /> },
);

const TravelTrustIllustrativeStats = dynamic(
  () =>
    import("./TravelTrustIllustrativeStats").then((m) => ({
      default: m.TravelTrustIllustrativeStats,
    })),
  { ssr: true, loading: () => <BelowFoldPlaceholder /> },
);

const TravelTrustQuickExplain = dynamic(
  () =>
    import("./TravelTrustQuickExplain").then((m) => ({ default: m.TravelTrustQuickExplain })),
  { ssr: true, loading: () => <BelowFoldPlaceholder /> },
);

const TravelTrustTrustFactsStrip = dynamic(
  () =>
    import("./TravelTrustTrustFactsStrip").then((m) => ({ default: m.TravelTrustTrustFactsStrip })),
  { ssr: true, loading: () => <BelowFoldPlaceholder /> },
);

const TravelTrustSettlementStrip = dynamic(
  () =>
    import("./TravelTrustSettlementStrip").then((m) => ({ default: m.TravelTrustSettlementStrip })),
  { ssr: true, loading: () => <BelowFoldPlaceholder /> },
);

const TravelTrustFaqStrip = dynamic(
  () => import("./TravelTrustFaqStrip").then((m) => ({ default: m.TravelTrustFaqStrip })),
  { ssr: true, loading: () => <BelowFoldPlaceholder /> },
);

const TravelTrustStartSection = dynamic(
  () =>
    import("./TravelTrustStartSection").then((m) => ({ default: m.TravelTrustStartSection })),
  { ssr: true, loading: () => <BelowFoldPlaceholder /> },
);

function BelowFoldPlaceholder({ tall = false }: { tall?: boolean }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={`border-t border-white/6 bg-gradient-to-b from-white/[0.03] to-transparent ${
        tall ? "min-h-[min(52vh,480px)]" : "min-h-[12rem]"
      }`}
      aria-hidden
      data-tt-traveltrust-below-fold-placeholder="1"
      data-tt-traveltrust-below-fold-placeholder-tall={tall ? "1" : "0"}
      animate={reduceMotion ? undefined : { opacity: [0.35, 0.55, 0.35] }}
      transition={reduceMotion ? undefined : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

type Props = {
  onTheaterViewportChange?: (anchor: TheaterViewportAnchor | null) => void;
};

/** 首屏以下区块 code-split（TT-PH1-020 · ①） */
export function TravelTrustBelowFoldSections({ onTheaterViewportChange }: Props) {
  return (
    <>
      <div
        className="pointer-events-none h-px w-full overflow-hidden opacity-0"
        aria-hidden
        data-tt-traveltrust-below-hero-fade="1"
      />
      <TravelTrustIdentityTheater onViewportChange={onTheaterViewportChange} />
      <TravelTrustSectionFilmDivider />
      <TravelTrustStablecoinGateway />
      <TravelTrustSectionFilmDivider />
      <TravelTrustIllustrativeStats />
      <TravelTrustQuickExplain />
      <TravelTrustSectionFilmDivider />
      <TravelTrustTrustFactsStrip />
      <TravelTrustSettlementStrip />
      <TravelTrustFaqStrip />
      <TravelTrustStartSection />
    </>
  );
}
