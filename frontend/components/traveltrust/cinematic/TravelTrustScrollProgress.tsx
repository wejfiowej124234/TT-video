"use client";



import { AnimatePresence, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring } from "framer-motion";

import { useCallback, useEffect, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";

import { traveltrustSectionLabelKey } from "@/lib/traveltrustSectionNavItems";

import { useTraveltrustPageCinematicPowerActive } from "@/lib/useTraveltrustPageCinematicPower";

import { useTraveltrustSectionNav } from "./useTraveltrustSectionNav";

import { useTravelTrustHeroScrollProgress } from "./TravelTrustHeroScrollContext";

import { useTravelTrustPageScrollProgress } from "./TravelTrustPageScrollContext";

import {
  resolveTravelTrustCinematicChapterForUi,
  TT_CINEMATIC_CHAPTER_NARRATIVE_KEYS,
  type TravelTrustCinematicChapter,
} from "./traveltrustCinematicChapters";
import {
  TT_SCROLL_PROGRESS_L5,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrustCinematicNonGlobeL5";



export function TravelTrustScrollProgress() {

  const { t } = useTranslation();

  const reduceMotion = useReducedMotion();

  const canvasActive = useTraveltrustPageCinematicPowerActive();

  const activeSection = useTraveltrustSectionNav();

  const { scrollYProgress } = useScroll();

  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });

  const chapterLabel = t(traveltrustSectionLabelKey(activeSection));

  const canvasIdle = !canvasActive;

  const heroScroll = useTravelTrustHeroScrollProgress();

  const pageScroll = useTravelTrustPageScrollProgress();

  const scrollFallback = useMotionValue(0);

  const [cinematicChapter, setCinematicChapter] = useState<TravelTrustCinematicChapter>("hero");



  const syncChapter = useCallback(() => {
    const heroT = heroScroll?.get() ?? 0;
    const pageT = pageScroll?.get() ?? 0;
    setCinematicChapter(resolveTravelTrustCinematicChapterForUi(heroT, pageT, activeSection));
  }, [activeSection, heroScroll, pageScroll]);

  useMotionValueEvent(heroScroll ?? scrollFallback, "change", syncChapter);
  useMotionValueEvent(pageScroll ?? scrollFallback, "change", syncChapter);
  useEffect(() => {
    syncChapter();
  }, [syncChapter]);



  if (reduceMotion) return null;



  const narrative = t(TT_CINEMATIC_CHAPTER_NARRATIVE_KEYS[cinematicChapter]);



  return (

    <>

      <motion.div

        className={`pointer-events-none fixed left-0 right-0 top-0 z-[29] h-0.5 origin-left ${TT_SCROLL_PROGRESS_L5.barClass} motion-reduce:hidden`}

        style={{ scaleX }}

        aria-hidden

        data-tt-traveltrust-scroll-progress="1"

        data-tt-traveltrust-scroll-progress-visible={canvasActive ? "1" : "0"}

        data-tt-traveltrust-page-cinematic-power-hint={canvasIdle ? "idle" : "active"}

        data-tt-traveltrust-scroll-progress-l5="1"
        data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}

        initial={false}

        animate={{ opacity: canvasActive ? 1 : 0 }}

        transition={{ duration: TT_SCROLL_PROGRESS_L5.barFadeDuration }}

      />

      <motion.div

        className={TT_SCROLL_PROGRESS_L5.chromeDockClass}

        aria-hidden

        data-tt-traveltrust-scroll-chrome="1"

        data-tt-traveltrust-scroll-chrome-l5="1"

        initial={false}

        animate={{ opacity: canvasActive || canvasIdle ? 1 : 0, y: canvasActive || canvasIdle ? 0 : 6 }}

        transition={{ duration: TT_SCROLL_PROGRESS_L5.chromeFadeDuration }}

      >

        {canvasIdle ? (

          <p

            className={TT_SCROLL_PROGRESS_L5.webglIdleHintClass}

            data-tt-traveltrust-webgl-idle-hint="1"

          >

            {t("traveltrust_webgl_idle_hint")}

          </p>

        ) : null}

        <motion.div

          key={`scroll-chapter-${activeSection}`}
          className={TT_SCROLL_PROGRESS_L5.chromeBaseClass}

          data-tt-traveltrust-scroll-chapter="1"

          data-tt-traveltrust-scroll-chapter-id={activeSection}

          data-tt-traveltrust-cinematic-chapter={cinematicChapter}
          data-tt-traveltrust-scroll-chapter-section-sync-l5="1"

          initial={{ opacity: 0.85 }}
          animate={
            canvasActive
              ? { opacity: 1, boxShadow: [...TT_SCROLL_PROGRESS_L5.chapterGlowShadow] }
              : { opacity: 1 }
          }
          transition={
            canvasActive
              ? {
                  duration: TT_SCROLL_PROGRESS_L5.chapterGlowDuration,
                  repeat: TT_SCROLL_PROGRESS_L5.chapterGlowRepeat,
                  ease: "easeInOut",
                }
              : { duration: TT_SCROLL_PROGRESS_L5.chapterFadeDuration }
          }
        >

          <AnimatePresence mode="wait">
            <motion.p
              key={`chapter-${activeSection}`}
              className={TT_SCROLL_PROGRESS_L5.chapterTitleClass}
              initial={{ opacity: 0, y: TT_SCROLL_PROGRESS_L5.narrativeSlideY }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -TT_SCROLL_PROGRESS_L5.narrativeSlideY }}
              transition={{ duration: TT_SCROLL_PROGRESS_L5.narrativeFadeDuration }}
            >
              {chapterLabel}
            </motion.p>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.p
              key={`narrative-${cinematicChapter}`}
              className={TT_SCROLL_PROGRESS_L5.narrativeClass}
              data-tt-traveltrust-scroll-chapter-narrative="1"
              initial={{ opacity: 0, y: TT_SCROLL_PROGRESS_L5.narrativeSlideY }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -TT_SCROLL_PROGRESS_L5.narrativeSlideY }}
              transition={{ duration: TT_SCROLL_PROGRESS_L5.narrativeFadeDuration }}
            >
              {narrative}
            </motion.p>
          </AnimatePresence>

        </motion.div>

      </motion.div>

    </>

  );

}


