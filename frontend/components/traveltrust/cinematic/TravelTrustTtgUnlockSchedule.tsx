"use client";

import { motion, useReducedMotion } from "framer-motion";
import { TT_TRAVELTRUST_SECTION_A11Y } from "./traveltrustSectionA11yIds";
import { useTranslation } from "@/components/LocaleProvider";
import {
  TTG_PUBLIC_UNLOCK_BATCHES,
  TTG_PUBLIC_UNLOCK_META,
  formatTtgUnlockAmount,
  formatUnlockClock,
  formatUnlockPct,
  formatUnlockUnitPrice,
  type TtgUnlockBatch,
} from "@/lib/governance/ttgPublicUnlockScheduleLocal";
import {
  TT_ECONOMY_INTERACT_L5,
  TT_L5_MOTION_EASE,
  TT_SECTION_CONTENT_L5,
  TT_SECTION_KICKER_L5,
  TT_TTG_UNLOCK_L5,
  traveltrustSectionL5DataAttrs,
} from "@/lib/traveltrust/l5";
import { traveltrustSectionChildStagger } from "./traveltrustSectionMotion";

function UnlockClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 8.25V12l2.4 2.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const BATCH_TITLE_KEYS = {
  1: "traveltrust_unlock_batch_1_title",
  2: "traveltrust_unlock_batch_2_title",
  3: "traveltrust_unlock_batch_3_title",
  4: "traveltrust_unlock_batch_4_title",
  5: "traveltrust_unlock_batch_5_title",
} as const;

const STATUS_KEYS = {
  upcoming: "traveltrust_unlock_status_upcoming",
  planned: "traveltrust_unlock_status_planned",
  featured: "traveltrust_unlock_status_featured",
} as const;

function statusClass(batch: TtgUnlockBatch): string {
  if (batch.status === "featured") return TT_TTG_UNLOCK_L5.statusFeaturedClass;
  if (batch.status === "upcoming") return TT_TTG_UNLOCK_L5.statusUpcomingClass;
  return TT_TTG_UNLOCK_L5.statusPlannedClass;
}

export function TravelTrustTtgUnlockSchedule() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const titleId = TT_TRAVELTRUST_SECTION_A11Y.unlock.title;

  return (
    <section
      id="unlock"
      className={TT_TTG_UNLOCK_L5.sectionSurfaceClass}
      aria-labelledby={titleId}
      data-tt-traveltrust-ttg-unlock="1"
      data-tt-traveltrust-ttg-unlock-motion-l5="1"
      data-tt-traveltrust-ttg-unlock-class={TTG_PUBLIC_UNLOCK_META.unlockClass}
      {...traveltrustSectionL5DataAttrs("unlock")}
    >
      <div className={TT_TTG_UNLOCK_L5.bodyClass}>
        <motion.p
          className={TT_SECTION_KICKER_L5}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-12% 0px" }}
          transition={traveltrustSectionChildStagger(0, reduceMotion)}
        >
          {t("traveltrust_unlock_eyebrow")}
        </motion.p>
        <motion.h2
          id={titleId}
          className={`${TT_SECTION_CONTENT_L5.kickerToHeadingClass} ${TT_SECTION_CONTENT_L5.headingClass}`}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-12% 0px" }}
          transition={traveltrustSectionChildStagger(1, reduceMotion)}
        >
          {t("traveltrust_unlock_title")}
        </motion.h2>
        <motion.p
          className={TT_SECTION_CONTENT_L5.introClass}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-12% 0px" }}
          transition={traveltrustSectionChildStagger(2, reduceMotion)}
        >
          {t("traveltrust_unlock_tagline")}
        </motion.p>
        <ol className={TT_TTG_UNLOCK_L5.listClass}>
          {TTG_PUBLIC_UNLOCK_BATCHES.map((batch, index) => (
            <motion.li
              key={batch.id}
              className={`${TT_TTG_UNLOCK_L5.rowClass} ${
                batch.status === "featured" ? TT_TTG_UNLOCK_L5.rowFeaturedClass : ""
              }`}
              style={{ clipPath: TT_TTG_UNLOCK_L5.rowClip }}
              data-tt-traveltrust-ttg-unlock-batch={batch.id}
              data-tt-traveltrust-ttg-unlock-price={formatUnlockUnitPrice(batch.unitPriceUsdc)}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              whileInView={
                reduceMotion
                  ? undefined
                  : {
                      opacity: 1,
                      y: 0,
                      transition: traveltrustSectionChildStagger(index, reduceMotion),
                    }
              }
              whileHover={
                reduceMotion
                  ? undefined
                  : { ...TT_TTG_UNLOCK_L5.rowHover, transition: TT_TTG_UNLOCK_L5.rowHoverTransition }
              }
              whileTap={reduceMotion ? undefined : TT_TTG_UNLOCK_L5.rowTap}
              viewport={{ once: true, margin: "-12% 0px" }}
            >
              {reduceMotion ? null : (
                <motion.span
                  aria-hidden
                  className={TT_ECONOMY_INTERACT_L5.sheenClass}
                  data-tt-traveltrust-ttg-unlock-sheen={batch.id}
                  initial={{ x: "-45%", opacity: 0 }}
                  whileInView={{
                    x: TT_ECONOMY_INTERACT_L5.sheenEnter.x[1],
                    opacity: TT_ECONOMY_INTERACT_L5.sheenEnter.opacity,
                  }}
                  viewport={{ once: true, margin: "-8% 0px" }}
                  transition={{
                    duration: TT_ECONOMY_INTERACT_L5.sheenDuration,
                    delay: 0.12 + index * 0.08,
                    ease: TT_L5_MOTION_EASE,
                  }}
                />
              )}
              <span aria-hidden className={TT_TTG_UNLOCK_L5.sheenHoverClass} />
              {batch.status === "featured" && !reduceMotion ? (
                <motion.span
                  aria-hidden
                  className={TT_TTG_UNLOCK_L5.featuredGlowClass}
                  data-tt-traveltrust-ttg-unlock-featured-glow="1"
                  animate={{ opacity: TT_TTG_UNLOCK_L5.featuredGlow.opacity }}
                  transition={{
                    duration: TT_TTG_UNLOCK_L5.featuredGlow.duration,
                    repeat: TT_TTG_UNLOCK_L5.featuredGlow.repeat,
                    ease: TT_TTG_UNLOCK_L5.featuredGlow.ease,
                  }}
                />
              ) : null}
              <div className={TT_TTG_UNLOCK_L5.leftClass}>
                <motion.span
                  className={TT_TTG_UNLOCK_L5.clockWrapClass}
                  animate={
                    reduceMotion || batch.status !== "upcoming"
                      ? undefined
                      : { rotate: TT_TTG_UNLOCK_L5.clockTick.rotate }
                  }
                  transition={{
                    duration: TT_TTG_UNLOCK_L5.clockTick.duration,
                    repeat: TT_TTG_UNLOCK_L5.clockTick.repeat,
                    repeatDelay: TT_TTG_UNLOCK_L5.clockTick.repeatDelay,
                    ease: TT_TTG_UNLOCK_L5.clockTick.ease,
                  }}
                >
                  <UnlockClockIcon />
                </motion.span>
                <div className="min-w-0">
                  <p className={TT_TTG_UNLOCK_L5.titleClass}>
                    {t(BATCH_TITLE_KEYS[batch.id])}
                  </p>
                  <p className={TT_TTG_UNLOCK_L5.dateClass}>{formatUnlockClock(batch.at)}</p>
                </div>
              </div>
              <div className={TT_TTG_UNLOCK_L5.rightClass}>
                <motion.span
                  className={statusClass(batch)}
                  animate={
                    reduceMotion || batch.status !== "upcoming"
                      ? undefined
                      : { opacity: TT_TTG_UNLOCK_L5.statusPulse.opacity }
                  }
                  transition={{
                    duration: TT_TTG_UNLOCK_L5.statusPulse.duration,
                    repeat: TT_TTG_UNLOCK_L5.statusPulse.repeat,
                    ease: TT_TTG_UNLOCK_L5.statusPulse.ease,
                  }}
                >
                  {t(STATUS_KEYS[batch.status])}
                </motion.span>
                {batch.status === "featured" ? (
                  <span className={TT_TTG_UNLOCK_L5.featuredTagClass}>
                    {t("traveltrust_unlock_featured_tag")}
                  </span>
                ) : null}
                <span className={TT_TTG_UNLOCK_L5.priceClass}>
                  {t("traveltrust_unlock_unit_price", {
                    rate: formatUnlockUnitPrice(batch.unitPriceUsdc),
                  })}
                </span>
                <span className={TT_TTG_UNLOCK_L5.pctClass}>
                  {formatUnlockPct(batch.pctOfTotal)}
                </span>
                <span className={TT_TTG_UNLOCK_L5.amountClass}>
                  {formatTtgUnlockAmount(batch.amountTtg)} TTG
                </span>
              </div>
            </motion.li>
          ))}
        </ol>
        <p className={TT_TTG_UNLOCK_L5.disclaimerClass}>{t("traveltrust_unlock_disclaimer")}</p>
      </div>
    </section>
  );
}
