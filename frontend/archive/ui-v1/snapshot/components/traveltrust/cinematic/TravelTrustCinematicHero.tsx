"use client";

import Link from "next/link";
import { motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useRef, type RefObject } from "react";
import { useTraveltrustHeroGlobeOpticalAlign } from "@/hooks/useTraveltrustHeroGlobeOpticalAlign";
import { TT_TRAVELTRUST_SECTION_A11Y } from "./traveltrustSectionA11yIds";
import { useTranslation } from "@/components/LocaleProvider";
import TravelTrustHeroBackdrop from "@/components/traveltrust/TravelTrustHeroBackdrop";
import { communityMediaAbsoluteUrlForRender } from "@/lib/communityMediaClientUrl";
import { trackTravelTrustEvent } from "@/lib/analytics";
import { useTravelTrustPageBriefContext } from "@/app/traveltrust/TravelTrustPageBriefContext";
import {
  TRAVELTRUST_HERO_DEFAULT_LOOP,
  TRAVELTRUST_HERO_DEFAULT_POSTER,
  TRAVELTRUST_HERO_LOOP_MP4,
  TRAVELTRUST_HERO_LOOP_POSTER,
} from "@/app/traveltrust/traveltrustIdentityModel";
import { resolveHeroMediaFromBrief } from "@/lib/traveltrustMediaFromBrief";
import dynamic from "next/dynamic";
import { TravelTrustHeroFilmChrome } from "./TravelTrustHeroFilmChrome";
import { TravelTrustHeroReduceMotionStars } from "./TravelTrustHeroReduceMotionStars";

const TravelTrustHorizonArc = dynamic(
  () => import("./TravelTrustHorizonArc").then((m) => ({ default: m.TravelTrustHorizonArc })),
  { ssr: false },
);
import { TravelTrustHeroWalletConnect } from "./TravelTrustHeroWalletConnect";
import { resolveTraveltrustPlanTripHref } from "@/lib/traveltrustPlanTripHref";
import { useTravelTrustHeroScrollProgress } from "./TravelTrustHeroScrollContext";
import { TRAVELTRUST_HERO_TRUST_CHIPS } from "@/lib/traveltrustHeroTrustChips";
import { TrustChipIcon } from "./TrustChipIcon";
import { TravelTrustHeroChainHud } from "./TravelTrustHeroChainHud";
import { TravelTrustHeroGuidance } from "./TravelTrustHeroGuidance";
import { TT_CINEMATIC_EASE, TT_HERO_ENTRANCE } from "./traveltrustCinematicMotion";
import {
  TT_HERO_BTN_GHOST_HERO,
  TT_HERO_BTN_GHOST_LINK,
  TT_HERO_CTA_DOCK,
} from "./traveltrustHeroUi";
import { TT_MARKETING_BTN_PRIMARY_WARM_HERO } from "@/lib/marketingUi";
import {
  TT_HERO_CHIP_ITEM_CLASS,
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
import { TT_TRAVELTRUST_HERO_CONTENT_OFFSET_CLASS } from "@/lib/traveltrustPageLayout";
import {
  TT_HERO_CTA_ROW_CLASS,
  TT_HERO_SCROLL_HINT_CLASS,
  TT_HERO_TAGLINE_CLASS,
  TT_HERO_TITLE_CLASS,
  TT_HERO_TRUST_CHIPS_ROW_CLASS,
} from "@/lib/traveltrustHeroTypography";
import { UNIFIED_PAGE_3D } from "./traveltrustPageCinematicConfig";
import { TravelTrustPhase1RegionRoster } from "./TravelTrustPhase1RegionRoster";

const chipList = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: TT_HERO_ENTRANCE.chips.stagger, delayChildren: TT_HERO_ENTRANCE.chips.delayChildren },
  },
};

const chipItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: TT_CINEMATIC_EASE } },
};

type Props = {
  /** 由页面级 useScroll 绑定，供全页 3D 与 Hero 滚动同步 */
  heroRef?: RefObject<HTMLElement | null>;
};

export function TravelTrustCinematicHero({ heroRef: heroRefProp }: Props = {}) {
  const { t } = useTranslation();
  const { brief } = useTravelTrustPageBriefContext();
  const reduceMotion = useReducedMotion();
  const isProductionHeroLoop = Boolean(TRAVELTRUST_HERO_LOOP_MP4?.trim());
  const planHref = resolveTraveltrustPlanTripHref(brief?.cta_contract.primary_target);
  const titleId = TT_TRAVELTRUST_SECTION_A11Y.hero.title;
  const heroFromBrief = resolveHeroMediaFromBrief(brief);
  const heroMp4Raw =
    heroFromBrief.mp4 || TRAVELTRUST_HERO_LOOP_MP4 || TRAVELTRUST_HERO_DEFAULT_LOOP;
  const heroMp4 = heroMp4Raw ? communityMediaAbsoluteUrlForRender(heroMp4Raw) : "";
  const heroPosterRaw =
    heroFromBrief.poster || TRAVELTRUST_HERO_LOOP_POSTER || TRAVELTRUST_HERO_DEFAULT_POSTER;
  const heroPoster = communityMediaAbsoluteUrlForRender(heroPosterRaw);
  const internalHeroRef = useRef<HTMLElement>(null);
  const heroRef = heroRefProp ?? internalHeroRef;
  const globeViewportRef = useRef<HTMLDivElement>(null);
  useTraveltrustHeroGlobeOpticalAlign(globeViewportRef, heroRef);
  const scrollFallback = useMotionValue(0);
  const scrollYProgress = useTravelTrustHeroScrollProgress() ?? scrollFallback;
  const contentY = useTransform(scrollYProgress, [0, 0.5, 1], [0, -24, -24]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75, 1], [1, 1, 0.25]);
  const mediaOpacity = useTransform(scrollYProgress, [0, 0.6, 1], [1, 0.65, 0.15]);
  /** unified：tier-1 占位片仅作球区柔光；生产 env 片源可全幅叠放（TT-PH1-165） */
  const showHeroVideo = Boolean(heroMp4) && !reduceMotion;
  const showTier1AccentVideo = showHeroVideo && UNIFIED_PAGE_3D && !isProductionHeroLoop;
  const showFullHeroVideo = showHeroVideo && !showTier1AccentVideo;
  const showHeroStaticPoster = Boolean(heroPoster) && UNIFIED_PAGE_3D && reduceMotion;

  return (
    <section
      ref={heroRef}
      id="hero"
      className={UNIFIED_PAGE_3D ? TT_MARKETING_TRAVELTRUST_HERO_SECTION_UNIFIED_3D_CLASS : TT_MARKETING_TRAVELTRUST_HERO_SECTION_CLASS}
      style={{
        ...TT_HERO_SPLIT_CSS_VARS_STYLE,
        ["--tt-hero-split-canvas-right" as string]: TT_HERO_SPLIT_CANVAS_RIGHT_INSET_CSS,
      }}
      dir="ltr"
      aria-labelledby={titleId}
      data-tt-traveltrust-hero-layout="split-lr"
    >
      <TravelTrustHeroFilmChrome />
      {UNIFIED_PAGE_3D && reduceMotion ? <TravelTrustHeroReduceMotionStars /> : null}
      {UNIFIED_PAGE_3D ? null : (
        <div className="absolute inset-0 z-0" aria-hidden>
          <TravelTrustHeroBackdrop />
        </div>
      )}
      {showTier1AccentVideo ? (
        <motion.div
          className="pointer-events-none absolute inset-x-0 top-[8%] z-[0] h-[min(48svh,520px)] overflow-hidden motion-reduce:hidden [mask-image:radial-gradient(ellipse_72%_68%_at_50%_48%,black_18%,transparent_74%)] lg:left-0 lg:right-auto lg:w-[calc(100%-var(--tt-hero-split-canvas-right,28rem))] lg:[mask-image:radial-gradient(ellipse_80%_70%_at_var(--tt-hero-globe-optical-x,32%)_48%,black_16%,transparent_72%)]"
          aria-hidden
          data-tt-traveltrust-hero-tier1-video="1"
          style={{ opacity: mediaOpacity }}
        >
          <video
            className="h-full w-full object-cover opacity-[0.16] saturate-[1.05] mix-blend-soft-light"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={heroPoster || undefined}
          >
            <source src={heroMp4} type="video/mp4" />
          </video>
        </motion.div>
      ) : null}
      {showFullHeroVideo ? (
        <motion.div
          className="pointer-events-none absolute inset-0 z-0 motion-reduce:hidden"
          aria-hidden
          style={{ opacity: mediaOpacity }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1.12 }}
            transition={{
              opacity: { duration: 1.1, ease: TT_CINEMATIC_EASE },
              scale: { duration: 22, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
            }}
            className="h-full w-full"
          >
            <video
              className="h-full w-full object-cover opacity-28 saturate-[1.08] mix-blend-screen"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={heroPoster || undefined}
            >
              <source src={heroMp4} type="video/mp4" />
            </video>
          </motion.div>
        </motion.div>
      ) : showHeroStaticPoster ? (
        <div
          className="pointer-events-none absolute inset-0 z-[0] overflow-hidden"
          aria-hidden
          data-tt-traveltrust-hero-static-fallback="1"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroPoster}
            alt=""
            className="h-full w-full object-cover opacity-38"
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
              : { opacity: { duration: 0.9 }, scale: { duration: 18, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" } }
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroPoster} alt="" className="h-full w-full object-cover opacity-45" />
        </motion.div>
      ) : null}

      {!reduceMotion ? (
        <motion.div
          className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-full overflow-hidden motion-reduce:hidden lg:w-[calc(100%-var(--tt-hero-split-canvas-right,28rem))]"
          aria-hidden
          initial={{ x: "-120%" }}
          animate={{ x: "120%" }}
          transition={{ duration: 6.2, repeat: Infinity, repeatDelay: 7, ease: "easeInOut" }}
        >
          <motion.div className="h-full w-full bg-[linear-gradient(105deg,transparent_42%,rgba(255,255,255,0.06)_50%,transparent_58%)]" />
        </motion.div>
      ) : null}

      <motion.div
        className={TT_HERO_UNIFIED_SCRIM_CLASS}
        aria-hidden
        data-tt-traveltrust-hero-scrim={UNIFIED_PAGE_3D ? "unified-3d" : "legacy"}
      />
      <motion.div
        className={`${TT_HERO_COPY_PANEL_SCRIM_CLASS}${UNIFIED_PAGE_3D ? " lg:hidden" : ""}`}
        aria-hidden
        data-tt-traveltrust-hero-copy-scrim="1"
      />
        <motion.div
          className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-20 bg-gradient-to-b from-[#030712]/72 via-[#080e12]/28 to-transparent motion-reduce:hidden"
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      />

      <motion.div
        className={`${TT_HERO_CONTENT_SHELL_CLASS} ${TT_TRAVELTRUST_HERO_CONTENT_OFFSET_CLASS}`}
        style={{ y: contentY, opacity: contentOpacity }}
        data-tt-traveltrust-hero-content-shell="1"
      >
        <motion.div
          ref={globeViewportRef}
          className={`${TT_HERO_GLOBE_VIEWPORT_CLASS}`}
          data-tt-traveltrust-hero-globe-viewport="1"
          data-tt-traveltrust-hero-globe-side="left"
        >
          <TravelTrustPhase1RegionRoster compactOnLg />
          <motion.div
            className={TT_MARKETING_HERO_GLOBE_DECOR_CLASS}
            role="img"
            aria-label={t("traveltrust_hero_globe_decorative")}
            data-tt-traveltrust-hero-globe-decor="1"
          />
        </motion.div>
        <motion.div className={TT_HERO_COPY_COL_CLASS} data-tt-traveltrust-hero-copy-col="1">
          <motion.div className={TT_HERO_COPY_CARD_CLASS} data-tt-traveltrust-hero-copy-card="1">
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
              className={TT_HERO_TITLE_CLASS}
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: TT_HERO_ENTRANCE.title.duration, delay: TT_HERO_ENTRANCE.title.delay, ease: TT_CINEMATIC_EASE }}
            >
              {t("traveltrust_title_brand")} {t("traveltrust_title_suffix")}
            </motion.h1>
            <motion.p
              className={TT_HERO_TAGLINE_CLASS}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: TT_HERO_ENTRANCE.tagline.duration, delay: TT_HERO_ENTRANCE.tagline.delay, ease: TT_CINEMATIC_EASE }}
            >
              {t("traveltrust_tagline")}
            </motion.p>

            <motion.ul
              className={TT_HERO_TRUST_CHIPS_ROW_CLASS}
              variants={reduceMotion ? undefined : chipList}
              initial={reduceMotion ? false : "hidden"}
              animate={reduceMotion ? undefined : "show"}
              data-tt-traveltrust-hero-trust-chips="1"
            >
              {TRAVELTRUST_HERO_TRUST_CHIPS.map(({ id, key, icon }) => (
                <motion.li
                  key={id}
                  variants={reduceMotion ? undefined : chipItem}
                  data-tt-traveltrust-hero-trust-chip={id}
                  className={TT_HERO_CHIP_ITEM_CLASS}
                  title={t(key)}
                >
                  <TrustChipIcon kind={icon} />
                  <span className="truncate">{t(key)}</span>
                </motion.li>
              ))}
            </motion.ul>
            <p
              className={`${TT_HERO_DISCLAIMER_CLASS} lg:text-left`}
              data-tt-traveltrust-hero-trust-chips-disclaimer="1"
            >
              {t("traveltrust_trust_chips_disclaimer")}{" "}
              <a href="#trust" className="font-medium text-ref-cyan underline-offset-2 hover:underline">
                {t("traveltrust_hero_guidance_cta_trust")}
              </a>
            </p>

            <TravelTrustHeroGuidance />
            <TravelTrustHeroChainHud />

            <motion.div
              className={`mt-5 sm:mt-6 ${TT_HERO_CTA_DOCK}`}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: TT_HERO_ENTRANCE.cta.duration, delay: TT_HERO_ENTRANCE.cta.delay, ease: TT_CINEMATIC_EASE }}
              data-tt-traveltrust-hero-cta-dock="1"
            >
              <div className={TT_HERO_CTA_ROW_CLASS}>
                <Link
                  href={planHref}
                  data-tt-traveltrust-plan-href={planHref}
                  onClick={() =>
                    trackTravelTrustEvent("traveltrust_plan_trip_click", { source: "hero", target: planHref })
                  }
                  className={`${TT_MARKETING_BTN_PRIMARY_WARM_HERO} w-full not-prose`}
                  data-tt-traveltrust-hero-cta-plan-warm="1"
                >
                  {t("traveltrust_hero_cta_plan")}
                </Link>
                <TravelTrustHeroWalletConnect buttonClassName={TT_HERO_BTN_GHOST_HERO} />
              </div>
              <motion.a
                href="#start"
                onClick={() =>
                  trackTravelTrustEvent("traveltrust_secondary_cta_click", { source: "hero", target: "#start" })
                }
                className={TT_HERO_BTN_GHOST_LINK}
                data-tt-traveltrust-hero-cta-ghost-link="1"
              >
                {t("traveltrust_scroll_to_start")}
              </motion.a>
            </motion.div>

            <motion.a
              href="#roles"
              className={`${TT_HERO_SCROLL_HINT_CLASS} mt-4 w-full border-t border-white/10 pt-4 sm:mt-5`}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: TT_HERO_ENTRANCE.scrollHint.duration, delay: TT_HERO_ENTRANCE.scrollHint.delay, ease: TT_CINEMATIC_EASE }}
              onClick={() =>
                trackTravelTrustEvent("traveltrust_scroll_to_roles", { source: "hero", target: "#roles" })
              }
              data-tt-traveltrust-hero-scroll-hint="copy-card"
            >
              <span>{t("traveltrust_scroll_hint")}</span>
              {!reduceMotion ? (
                <motion.span
                  aria-hidden
                  animate={{ y: [0, 5, 0], opacity: [0.45, 1, 0.45] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  ↓
                </motion.span>
              ) : (
                <span aria-hidden>↓</span>
              )}
            </motion.a>
          </motion.div>
        </motion.div>
      </motion.div>

      {UNIFIED_PAGE_3D ? null : <TravelTrustHorizonArc />}
    </section>
  );
}
