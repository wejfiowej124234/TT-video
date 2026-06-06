"use client";

import dynamic from "next/dynamic";
import { useRef, useState, useCallback, useEffect } from "react";
import { useScroll } from "framer-motion";
import { TravelTrustCinematicShell } from "@/components/traveltrust/cinematic/TravelTrustCinematicShell";
import { TravelTrustCinematicHero } from "@/components/traveltrust/cinematic/TravelTrustCinematicHero";
import { TravelTrustBelowFoldSections } from "@/components/traveltrust/cinematic/TravelTrustBelowFoldSections";

const TravelTrustPageCinematicCanvas = dynamic(
  () =>
    import("@/components/traveltrust/cinematic/TravelTrustPageCinematicCanvas").then((m) => ({
      default: m.TravelTrustPageCinematicCanvas,
    })),
  { ssr: false },
);

const TravelTrustLandingChrome = dynamic(
  () =>
    import("@/components/traveltrust/cinematic/TravelTrustLandingChrome").then((m) => ({
      default: m.TravelTrustLandingChrome,
    })),
  { ssr: true, loading: () => <ChromeNavPlaceholder /> },
);

const TravelTrustNetworkFooter = dynamic(
  () =>
    import("@/components/traveltrust/cinematic/TravelTrustNetworkFooter").then((m) => ({
      default: m.TravelTrustNetworkFooter,
    })),
  { ssr: true, loading: () => <FooterPlaceholder /> },
);

const TravelTrustScrollProgress = dynamic(
  () =>
    import("@/components/traveltrust/cinematic/TravelTrustScrollProgress").then((m) => ({
      default: m.TravelTrustScrollProgress,
    })),
  { ssr: false },
);

import { TravelTrustPageScrollContext } from "@/components/traveltrust/cinematic/TravelTrustPageScrollContext";
import { TravelTrustHeroScrollContext } from "@/components/traveltrust/cinematic/TravelTrustHeroScrollContext";
import { TravelTrustTheaterRoleProvider } from "@/components/traveltrust/cinematic/TravelTrustTheaterRoleContext";
import {
  TravelTrustTheaterViewportContext,
  type TheaterViewportAnchor,
} from "@/components/traveltrust/cinematic/TravelTrustTheaterViewportContext";
import { UNIFIED_PAGE_3D } from "@/components/traveltrust/cinematic/traveltrustPageCinematicConfig";
import {
  TT_HERO_SPLIT_CANVAS_RIGHT_INSET_CSS,
  TT_HERO_SPLIT_CSS_VARS_STYLE,
} from "@/lib/traveltrustHeroSplitLayout";
import {
  TT_TRAVELTRUST_PAGE_BLEED_BAND_CLASS,
  TT_TRAVELTRUST_PAGE_FRAME_CLASS,
} from "@/lib/traveltrustPageLayout";
import { useTranslation } from "@/components/LocaleProvider";
import { getTraveltrustTextDirection } from "@/lib/traveltrustLocaleLayout";
import { useTraveltrustHashScroll } from "@/hooks/useTraveltrustHashScroll";
import { initTraveltrustCinematicQualityPrefs } from "@/lib/traveltrustCinematicPerf";
import { TravelTrustBelowFoldAtmosphere } from "@/components/traveltrust/cinematic/TravelTrustBelowFoldAtmosphere";
import { TravelTrustCinematicA11y } from "@/components/traveltrust/cinematic/TravelTrustCinematicA11y";
import { TravelTrustReducedMotionNotice } from "@/components/traveltrust/cinematic/TravelTrustReducedMotionNotice";
import { TravelTrustDevChunkRecoveryNotice } from "@/components/traveltrust/cinematic/TravelTrustDevChunkRecoveryNotice";
import { TravelTrustPageBriefStatus } from "@/components/traveltrust/TravelTrustPageBriefStatus";
import { TravelTrustPageBriefProvider, useTravelTrustPageBriefContext } from "./TravelTrustPageBriefContext";

function ChromeNavPlaceholder() {
  return (
    <div
      className="sticky top-14 z-[20] -mx-4 mb-2 h-14 border-b border-white/10 bg-[#0a0908]/92 sm:-mx-6"
      aria-hidden
      data-tt-traveltrust-chrome-placeholder="1"
    />
  );
}

function FooterPlaceholder() {
  return (
    <div className="mt-4 h-24 border-t border-white/8" aria-hidden data-tt-traveltrust-footer-placeholder="1" />
  );
}

function TravelTrustNetworkPageMainBody() {
  const { t, locale } = useTranslation();
  const { ready } = useTravelTrustPageBriefContext();
  const textDirection = getTraveltrustTextDirection(locale);
  const mainRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const [theaterViewport, setTheaterViewport] = useState<TheaterViewportAnchor | null>(null);

  const { scrollYProgress: pageScroll } = useScroll({
    target: mainRef,
    offset: ["start start", "end end"],
  });
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  useTraveltrustHashScroll();

  useEffect(() => {
    initTraveltrustCinematicQualityPrefs();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefetch = () => {
      void import("@/components/traveltrust/cinematic/TravelTrustPageCinematicScene");
      void import("@/components/traveltrust/cinematic/TravelTrustIdentityTheater");
      void import("@/components/traveltrust/cinematic/TravelTrustStablecoinGateway");
    };
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(prefetch, { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }
    const t = globalThis.setTimeout(prefetch, 800);
    return () => globalThis.clearTimeout(t);
  }, []);

  const onTheaterViewport = useCallback((anchor: TheaterViewportAnchor | null) => {
    setTheaterViewport((prev) => {
      if (!anchor && !prev) return prev;
      if (
        anchor &&
        prev &&
        Math.abs(prev.centerY - anchor.centerY) < 6 &&
        Math.abs(prev.height - anchor.height) < 6
      ) {
        return prev;
      }
      return anchor;
    });
  }, []);

  return (
    <TravelTrustCinematicShell>
      <TravelTrustPageBriefStatus />
      <TravelTrustDevChunkRecoveryNotice />
      <TravelTrustCinematicA11y />
      <TravelTrustReducedMotionNotice />
      <TravelTrustScrollProgress />
      <TravelTrustTheaterRoleProvider>
        <TravelTrustHeroScrollContext.Provider value={heroScroll}>
          <TravelTrustPageScrollContext.Provider value={pageScroll}>
            <TravelTrustTheaterViewportContext.Provider value={theaterViewport}>
              <a
                href="#hero"
                className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-20 focus:z-[30] focus:rounded-lg focus:bg-ink-900 focus:px-4 focus:py-2 focus:text-small focus:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/60"
              >
                {t("traveltrust_skip_to_hero")}
              </a>
              <main
                ref={mainRef}
                dir={textDirection}
                className={`relative z-[2] min-h-screen${UNIFIED_PAGE_3D ? " bg-[#030712]" : ""}`}
                style={{
                  ...TT_HERO_SPLIT_CSS_VARS_STYLE,
                  ["--tt-hero-split-canvas-right" as string]: TT_HERO_SPLIT_CANVAS_RIGHT_INSET_CSS,
                }}
                aria-label={t("traveltrust_title")}
                data-tt-traveltrust-network-page="1"
                data-tt-traveltrust-ia-version="v6"
                data-tt-ui-generation="v2"
                data-tt-traveltrust-page-brief-ready={ready ? "1" : "0"}
                data-tt-traveltrust-unified-3d={UNIFIED_PAGE_3D ? "1" : "0"}
                data-tt-traveltrust-text-direction={textDirection}
              >
                {UNIFIED_PAGE_3D ? <TravelTrustPageCinematicCanvas /> : null}
                {UNIFIED_PAGE_3D ? <TravelTrustBelowFoldAtmosphere /> : null}
                <div
                  className={`${TT_TRAVELTRUST_PAGE_BLEED_BAND_CLASS} z-[25]`}
                  data-tt-traveltrust-landing-nav-slot="sticky"
                >
                  <div className={TT_TRAVELTRUST_PAGE_FRAME_CLASS}>
                    <TravelTrustLandingChrome />
                  </div>
                </div>
                <TravelTrustCinematicHero heroRef={heroRef} />
                <div className={`${TT_TRAVELTRUST_PAGE_BLEED_BAND_CLASS} relative z-[10]`}>
                  <div className={TT_TRAVELTRUST_PAGE_FRAME_CLASS}>
                    <TravelTrustBelowFoldSections onTheaterViewportChange={onTheaterViewport} />
                  </div>
                </div>
                <TravelTrustNetworkFooter />
              </main>
            </TravelTrustTheaterViewportContext.Provider>
          </TravelTrustPageScrollContext.Provider>
        </TravelTrustHeroScrollContext.Provider>
      </TravelTrustTheaterRoleProvider>
    </TravelTrustCinematicShell>
  );
}

export function TravelTrustNetworkPageMain() {
  return (
    <TravelTrustPageBriefProvider>
      <TravelTrustNetworkPageMainBody />
    </TravelTrustPageBriefProvider>
  );
}
