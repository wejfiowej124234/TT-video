"use client";

import Link from "next/link";
import { motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useMemo, useRef, useState, type RefObject } from "react";
import { useTraveltrustHeroGlobeOpticalAlign } from "@/hooks/useTraveltrustHeroGlobeOpticalAlign";
import { TT_TRAVELTRUST_SECTION_A11Y } from "./traveltrustSectionA11yIds";
import { useTranslation } from "@/components/LocaleProvider";
import TravelTrustHeroBackdrop from "@/components/traveltrust/TravelTrustHeroBackdrop";
import { communityMediaAbsoluteUrlForRender } from "@/lib/communityMediaClientUrl";
import { trackTravelTrustEvent } from "@/lib/analytics";
import { useTravelTrustPageBriefContext } from "@/app/traveltrust/TravelTrustPageBriefContext";
import { useHeroMediaUrlsHydrated } from "@/lib/useTraveltrustMediaUrlsHydrated";
import { TT_CINEMATIC_HERO_MEDIA } from "@/lib/traveltrustCinematicVisual";
import { TT_Z, ttZClass } from "@/lib/traveltrustZ";
import dynamic from "next/dynamic";
import { TravelTrustHeroReduceMotionStars } from "./TravelTrustHeroReduceMotionStars";

const TravelTrustHorizonArc = dynamic(
  () => import("./TravelTrustHorizonArc").then((m) => ({ default: m.TravelTrustHorizonArc })),
  { ssr: false },
);
import { resolveTraveltrustPlanTripHref } from "@/lib/traveltrustPlanTripHref";
import { useTravelTrustHeroScrollProgress } from "./TravelTrustHeroScrollContext";
import { TRAVELTRUST_HERO_TRUST_CHIPS } from "@/lib/traveltrustHeroTrustChips";
import { TrustChipIcon } from "./TrustChipIcon";
import { TravelTrustAppDownloadDialog } from "./TravelTrustAppDownloadDialog";
import { TravelTrustHeroChainHud } from "./TravelTrustHeroChainHud";
import { TravelTrustHeroGuidance } from "./TravelTrustHeroGuidance";
import { TT_CINEMATIC_EASE, TT_HERO_ENTRANCE } from "./traveltrustCinematicMotion";
import { TT_HERO_BTN_GHOST_LINK, TT_HERO_CTA_DOCK } from "./traveltrustHeroUi";
import { TT_CINEMATIC_PAGE_L5 } from "@/lib/traveltrustCinematicPageL5";
import {
  TT_HERO_COPY_DISCLAIMER_L5,
  TT_HERO_COPY_UI_L5,
  TT_HERO_PRIMARY_CTA_L5,
  TT_HERO_CTA_L5,
  TT_PAGE_LAYOUT_L5,
  TT_PAGE_SCROLL_SNAP_L5,
  traveltrustChapterBeatDataAttrs,
  traveltrustChapterViewportDataAttrs,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrust/l5";
import {
  TT_HERO_CONTENT_SHELL_CLASS,
  TT_HERO_COPY_CARD_CLASS,
  TT_HERO_COPY_COL_CLASS,
  TT_HERO_DISCLAIMER_CLASS,
  TT_HERO_COPY_PANEL_SCRIM_CLASS,
  TT_HERO_GLOBE_VIEWPORT_CLASS,
  TT_HERO_UNIFIED_SCRIM_CLASS,
} from "@/lib/traveltrustHeroLayout";
import {
  TT_HERO_SPLIT_CANVAS_RIGHT_INSET_CSS,
  TT_HERO_SPLIT_CSS_VARS_STYLE,
} from "@/lib/traveltrustHeroSplitLayout";
import {
  TT_MARKETING_HERO_GLOBE_DECOR_CLASS,
  TT_MARKETING_TRAVELTRUST_HERO_SECTION_CLASS,
  TT_MARKETING_TRAVELTRUST_HERO_SECTION_UNIFIED_3D_CLASS,
} from "@/lib/marketingUi";
import { TT_HERO_KICKER_CLASS } from "@/lib/traveltrustHeroKicker";
import {
  TT_HERO_CTA_ROW_CLASS,
  TT_HERO_TITLE_BRAND_CLASS,
  TT_HERO_TITLE_CLASS,
  TT_HERO_TITLE_SUFFIX_CLASS,
  TT_HERO_TRUST_CHIPS_ROW_CLASS,
} from "@/lib/traveltrustHeroTypography";
import { UNIFIED_PAGE_3D } from "./traveltrustPageCinematicConfig";
import { TravelTrustPhase1RegionRoster } from "./TravelTrustPhase1RegionRoster";
import { TravelTrustHeroGlobeNetworkDecor } from "./TravelTrustHeroGlobeNetworkDecor";
import { TravelTrustHeroL5ExperienceLayers } from "./TravelTrustHeroL5ExperienceLayers";
import {
  TRAVELTRUST_HERO_GLOBE_BRIGHTEN_ACTIVE_ID,
  TRAVELTRUST_HERO_GLOBE_BRIGHTEN_ACTIVE_STEP,
} from "@/lib/traveltrustHeroGlobeBrighten";
import { TravelTrustHeroDestinationLabels } from "./TravelTrustHeroDestinationLabels";
import { TravelTrustHeroNetworkNarrative } from "./TravelTrustHeroNetworkNarrative";
import { useTraveltrustGlobeHeroHud } from "@/lib/traveltrustGlobeHeroHud";
import {
  buildTraveltrustPlanTripHrefWithRegion,
  resolveHeroGlobeP1DefaultRegion,
  setHeroGlobeP1FocusedRegion,
  setHeroGlobeP1StartPrefill,
  useHeroGlobeP1Link,
} from "@/lib/traveltrustHeroGlobeP1Link";

const chipList = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: TT_HERO_ENTRANCE.chips.stagger, delayChildren: TT_HERO_ENTRANCE.chips.delayChildren },
  },
};

const chipItem = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: TT_HERO_COPY_UI_L5.chipItemDuration, ease: TT_CINEMATIC_EASE },
  },
};

type Props = {
  /** 由页面级 useScroll 绑定，供全页 3D 与 Hero 滚动同步 */
  heroRef?: RefObject<HTMLElement | null>;
};

export function TravelTrustCinematicHero({ heroRef: heroRefProp }: Props = {}) {
  const { t } = useTranslation();
  const [appDownloadOpen, setAppDownloadOpen] = useState(false);
  const { brief } = useTravelTrustPageBriefContext();
  const reduceMotion = useReducedMotion();
  const planHref = resolveTraveltrustPlanTripHref(brief?.cta_contract.primary_target);
  const { routeBias } = useTraveltrustGlobeHeroHud();
  const { focusedRegionId, startPrefillRegionId } = useHeroGlobeP1Link();
  const ctaRegionId =
    focusedRegionId ?? startPrefillRegionId ?? resolveHeroGlobeP1DefaultRegion(routeBias);
  const planHrefWithRegion = buildTraveltrustPlanTripHrefWithRegion(planHref, ctaRegionId);
  const titleId = TT_TRAVELTRUST_SECTION_A11Y.hero.title;
  const { media: heroMedia, hydrationSettled: heroMediaHydrationSettled } =
    useHeroMediaUrlsHydrated(brief);
  const heroPoster = communityMediaAbsoluteUrlForRender(heroMedia.poster);
  const internalHeroRef = useRef<HTMLElement>(null);
  const heroRef = heroRefProp ?? internalHeroRef;
  const globeViewportRef = useRef<HTMLDivElement>(null);
  useTraveltrustHeroGlobeOpticalAlign(globeViewportRef, heroRef);
  const scrollFallback = useMotionValue(0);
  const scrollYProgress = useTravelTrustHeroScrollProgress() ?? scrollFallback;
  const contentY = useTransform(scrollYProgress, [0, 0.5, 1], [0, -24, -24]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75, 1], [1, 1, 0.25]);
  /** 首屏蓝紫横条根因已移除：`hero-loop` 全幅 `<video mix-blend-screen>`（无对应 `backgroundColor: rgb(8,7,77)` 节点） */
  const showHeroStaticPoster = Boolean(heroPoster) && UNIFIED_PAGE_3D && reduceMotion;
  return (
    <section
      ref={heroRef}
      id="hero"
      className={`${UNIFIED_PAGE_3D ? TT_MARKETING_TRAVELTRUST_HERO_SECTION_UNIFIED_3D_CLASS : TT_MARKETING_TRAVELTRUST_HERO_SECTION_CLASS} relative ${ttZClass(TT_Z.HERO_SKY)} scroll-snap-center`}
      data-tt-traveltrust-snap-align="center"
      style={{
        position: "relative",
        ...TT_HERO_SPLIT_CSS_VARS_STYLE,
        ["--tt-hero-split-canvas-right" as string]: TT_HERO_SPLIT_CANVAS_RIGHT_INSET_CSS,
      }}
      data-tt-traveltrust-hero-dom-video="0"
      dir="ltr"
      aria-labelledby={titleId}
      data-tt-traveltrust-hero-layout="split-lr"
      data-tt-traveltrust-hero-media-tier={heroMedia.tier}
      data-tt-traveltrust-hero-media-hydration-settled={heroMediaHydrationSettled ? "1" : "0"}
      data-tt-traveltrust-hero-loop-env-key={heroMedia.loopEnvKey}
      data-tt-traveltrust-hero-section="1"
      {...traveltrustChapterBeatDataAttrs(TT_PAGE_SCROLL_SNAP_L5.chapterBeatHero)}
      {...traveltrustChapterViewportDataAttrs()}
      data-tt-traveltrust-hero-narrative-l5="web3-network"
      data-tt-traveltrust-hero-globe-p1-link="1"
      data-tt-traveltrust-hero-l5-director-final-pass="TT-HERO-L5-DIRECTOR-FINAL-PASS-2026-05"
      data-tt-traveltrust-hero-globe-brighten-step={String(TRAVELTRUST_HERO_GLOBE_BRIGHTEN_ACTIVE_STEP)}
      data-tt-traveltrust-hero-globe-brighten-id={TRAVELTRUST_HERO_GLOBE_BRIGHTEN_ACTIVE_ID}
      data-tt-traveltrust-globe-focused-region={focusedRegionId ?? ""}
      data-tt-traveltrust-hero-cta-prefill-region={ctaRegionId}
    >
      {UNIFIED_PAGE_3D && reduceMotion ? <TravelTrustHeroReduceMotionStars /> : null}
      {UNIFIED_PAGE_3D ? null : (
        <div className="absolute inset-0 z-0" aria-hidden>
          <TravelTrustHeroBackdrop />
        </div>
      )}
      {showHeroStaticPoster ? (
        <div
          className="pointer-events-none absolute inset-0 z-[0] overflow-hidden"
          aria-hidden
          data-tt-traveltrust-hero-static-fallback="1"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroPoster}
            alt=""
            className="h-full w-full object-cover"
            style={{ opacity: TT_CINEMATIC_HERO_MEDIA.staticPosterOpacity }}
            fetchPriority="high"
            decoding="async"
          />
        </div>
      ) : heroPoster && !UNIFIED_PAGE_3D ? (
        <motion.div
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden motion-reduce:opacity-100"
          aria-hidden
          initial={reduceMotion ? false : { opacity: 0, scale: 1.05 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1.14 }}
          transition={
            reduceMotion
              ? undefined
              : {
                  opacity: { duration: TT_HERO_COPY_UI_L5.legacyPosterOpacityDuration },
                  scale: {
                    duration: TT_HERO_COPY_UI_L5.legacyPosterScaleDuration,
                    repeat: TT_HERO_COPY_UI_L5.legacyPosterScaleRepeat,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  },
                }
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroPoster} alt="" className="h-full w-full object-cover opacity-45" />
        </motion.div>
      ) : null}

      {!reduceMotion && !UNIFIED_PAGE_3D ? (
        <motion.div
          className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-full overflow-hidden motion-reduce:hidden lg:w-[calc(100%-var(--tt-hero-split-canvas-right,28rem))]"
          aria-hidden
          initial={{ x: "-120%" }}
          animate={{ x: "120%" }}
          transition={{
            duration: TT_HERO_COPY_UI_L5.copyShimmerDuration,
            repeat: TT_HERO_COPY_UI_L5.copyShimmerRepeat,
            repeatDelay: TT_HERO_COPY_UI_L5.copyShimmerRepeatDelay,
            ease: "easeInOut",
          }}
          data-tt-traveltrust-hero-copy-shimmer-l5="1"
          data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
        >
          <motion.div className="h-full w-full bg-[linear-gradient(105deg,transparent_42%,rgba(255,255,255,0.06)_50%,transparent_58%)]" />
        </motion.div>
      ) : null}

      {UNIFIED_PAGE_3D ? null : (
        <motion.div
          className={TT_HERO_UNIFIED_SCRIM_CLASS}
          aria-hidden
          data-tt-traveltrust-hero-scrim="legacy"
        />
      )}
      {UNIFIED_PAGE_3D ? null : (
        <motion.div
          className={TT_HERO_COPY_PANEL_SCRIM_CLASS}
          aria-hidden
          data-tt-traveltrust-hero-copy-scrim="1"
        />
      )}
      {UNIFIED_PAGE_3D ? null : (
        <motion.div
          className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-20 bg-gradient-to-b from-[#0c0a09]/78 via-[#0c0a09]/32 to-transparent motion-reduce:hidden"
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: TT_HERO_COPY_UI_L5.topVignetteFadeDuration }}
          data-tt-traveltrust-hero-top-vignette-l5="1"
        />
      )}

      <motion.div
        className={`${TT_HERO_CONTENT_SHELL_CLASS} ${TT_PAGE_LAYOUT_L5.heroContentOffsetClass}`}
        style={{ y: contentY, opacity: contentOpacity }}
        data-tt-traveltrust-hero-content-shell="1"
      >
        <motion.div
          ref={globeViewportRef}
          className={`${TT_HERO_GLOBE_VIEWPORT_CLASS}`}
          data-tt-traveltrust-hero-globe-viewport="1"
          data-tt-traveltrust-hero-globe-side="left"
        >
          <TravelTrustPhase1RegionRoster />
          <TravelTrustPhase1RegionRoster compactOnLg />
          <TravelTrustHeroL5ExperienceLayers />
          <TravelTrustHeroGlobeNetworkDecor />
          <TravelTrustHeroDestinationLabels />
          <motion.div
            className={TT_MARKETING_HERO_GLOBE_DECOR_CLASS}
            role="img"
            aria-label={t("traveltrust_hero_globe_decorative")}
            data-tt-traveltrust-hero-globe-decor="1"
            animate={
              reduceMotion
                ? undefined
                : {
                    scale: [1, 1.015, 1],
                    opacity: [0.88, 1, 0.88],
                  }
            }
            transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
        <motion.div className={TT_HERO_COPY_COL_CLASS} data-tt-traveltrust-hero-copy-col="1">
          <motion.div
            className={`${TT_HERO_COPY_CARD_CLASS} ${TT_HERO_COPY_UI_L5.cardL5EnhanceClass} ${TT_HERO_COPY_UI_L5.cardBreathingClass}`}
            data-tt-traveltrust-hero-copy-card="1"
          >
            <motion.p
              className={TT_HERO_KICKER_CLASS}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: TT_HERO_ENTRANCE.kicker.duration, delay: TT_HERO_ENTRANCE.kicker.delay, ease: TT_CINEMATIC_EASE }}
            >
              {t("traveltrust_hero_kicker")}
            </motion.p>
            <motion.h1
              id={titleId}
              className={`${TT_HERO_TITLE_CLASS} mt-0.5`}
              data-tt-traveltrust-hero-title="1"
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: TT_HERO_ENTRANCE.title.duration, delay: TT_HERO_ENTRANCE.title.delay, ease: TT_CINEMATIC_EASE }}
            >
              <span className={TT_HERO_TITLE_BRAND_CLASS}>{t("traveltrust_hero_title_brand")}</span>
              <span className={TT_HERO_TITLE_SUFFIX_CLASS}>{t("traveltrust_hero_title_suffix")}</span>
            </motion.h1>
            <TravelTrustHeroNetworkNarrative />

            <motion.ul
              className={`${TT_HERO_TRUST_CHIPS_ROW_CLASS} ${TT_HERO_COPY_UI_L5.chipsRowClass}`}
              variants={reduceMotion ? undefined : chipList}
              initial={reduceMotion ? false : "hidden"}
              animate={reduceMotion ? undefined : "show"}
              data-tt-traveltrust-hero-trust-chips="1"
            >
              {TRAVELTRUST_HERO_TRUST_CHIPS.map(({ id, key, icon }) => (
                <motion.li
                  key={id}
                  variants={reduceMotion ? undefined : chipItem}
                  whileHover={reduceMotion ? undefined : TT_HERO_COPY_UI_L5.trustChipHover}
                  whileTap={reduceMotion ? undefined : TT_HERO_COPY_UI_L5.trustChipTap}
                  data-tt-traveltrust-hero-trust-chip={id}
                  className={TT_CINEMATIC_PAGE_L5.heroTrustChip.itemClass}
                  data-tt-traveltrust-hero-trust-chip-l5="1"
                  data-tt-traveltrust-hero-trust-chip-hover-l5="1"
                  title={t(key)}
                >
                  <span className={TT_CINEMATIC_PAGE_L5.heroTrustChip.iconWrapClass} aria-hidden>
                    <TrustChipIcon kind={icon} />
                  </span>
                  <span className="truncate">{t(key)}</span>
                </motion.li>
              ))}
            </motion.ul>
            <p
              className={`${TT_HERO_DISCLAIMER_CLASS} ${TT_HERO_COPY_UI_L5.disclaimerClass} lg:text-left`}
              data-tt-traveltrust-hero-trust-chips-disclaimer="1"
            >
              {t("traveltrust_hero_trust_chips_disclaimer")}{" "}
              <motion.a
                href="#trust"
                className={TT_HERO_COPY_DISCLAIMER_L5.trustLinkClass}
                whileHover={reduceMotion ? undefined : { y: -1 }}
              >
                {t("traveltrust_hero_guidance_cta_trust")}
              </motion.a>
            </p>

            <TravelTrustHeroGuidance />
            <TravelTrustHeroChainHud />

            <motion.div
              className={`${TT_HERO_COPY_UI_L5.ctaDockClass} ${TT_HERO_CTA_DOCK}`}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: TT_HERO_ENTRANCE.cta.duration, delay: TT_HERO_ENTRANCE.cta.delay, ease: TT_CINEMATIC_EASE }}
              data-tt-traveltrust-hero-cta-dock="1"
            >
              <motion.div className={TT_HERO_CTA_ROW_CLASS}>
                <motion.div
                  className="relative w-full"
                  whileHover={reduceMotion ? undefined : TT_HERO_CTA_L5.primaryHover}
                  whileTap={reduceMotion ? undefined : TT_HERO_CTA_L5.primaryTap}
                  data-tt-traveltrust-hero-cta-primary-pulse-l5="1"
                >
                  {!reduceMotion ? (
                    <motion.span
                      className={TT_HERO_CTA_L5.primaryPulseClass}
                      aria-hidden
                      animate={{ opacity: [...TT_HERO_CTA_L5.primaryPulse.opacity] }}
                      transition={{
                        duration: TT_HERO_CTA_L5.primaryPulse.duration,
                        repeat: TT_HERO_CTA_L5.primaryPulse.repeat,
                        ease: "easeInOut",
                      }}
                    />
                  ) : null}
                  <Link
                    href="#liquidity"
                    aria-label={t("traveltrust_hero_cta_ttg_aria")}
                    onClick={() =>
                      trackTravelTrustEvent("traveltrust_secondary_cta_click", {
                        source: "hero",
                        target: "#liquidity",
                        role: "get_ttg",
                      })
                    }
                    className={`${TT_HERO_PRIMARY_CTA_L5} ${TT_HERO_COPY_UI_L5.ctaGlowClass}`}
                    data-tt-traveltrust-hero-cta-l5="1"
                    data-tt-traveltrust-hero-cta-ttg="1"
                  >
                    {t("traveltrust_hero_cta_ttg")}
                  </Link>
                </motion.div>
                <Link
                  href={planHrefWithRegion}
                  data-tt-traveltrust-plan-href={planHrefWithRegion}
                  onClick={() => {
                    setHeroGlobeP1StartPrefill(ctaRegionId);
                    setHeroGlobeP1FocusedRegion(ctaRegionId);
                    trackTravelTrustEvent("traveltrust_plan_trip_click", {
                      source: "hero",
                      target: planHrefWithRegion,
                      region_id: ctaRegionId,
                      corridor: routeBias,
                    });
                  }}
                  className={TT_HERO_BTN_GHOST_LINK}
                  data-tt-traveltrust-hero-cta-plan-warm="1"
                  data-tt-traveltrust-hero-cta-plan="1"
                >
                  {t("traveltrust_hero_cta_plan")}
                </Link>
                <button
                  type="button"
                  className={TT_HERO_BTN_GHOST_LINK}
                  aria-label={t("traveltrust_hero_cta_app_aria")}
                  data-tt-traveltrust-hero-cta-app="1"
                  onClick={() => {
                    trackTravelTrustEvent("traveltrust_secondary_cta_click", {
                      source: "hero",
                      target: "app_download_coming_soon",
                    });
                    setAppDownloadOpen(true);
                  }}
                >
                  {t("traveltrust_hero_cta_app")}
                </button>
              </motion.div>
            </motion.div>
            <TravelTrustAppDownloadDialog
              open={appDownloadOpen}
              onClose={() => setAppDownloadOpen(false)}
            />

            <Link
              href="#liquidity"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-[calc(100%-3rem)] focus:z-20 focus:rounded-lg focus:bg-ink-900 focus:px-3 focus:py-2 focus:text-meta focus:text-white"
              data-tt-traveltrust-hero-cta-skip-start="1"
            >
              {t("traveltrust_scroll_to_start")}
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>

      {UNIFIED_PAGE_3D ? null : <TravelTrustHorizonArc />}
    </section>
  );
}
