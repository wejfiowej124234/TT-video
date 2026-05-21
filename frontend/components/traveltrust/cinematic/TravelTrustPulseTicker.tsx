"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { TRAVELTRUST_NETWORK_ANNOUNCEMENTS, type TravelTrustAnnouncement } from "@/lib/traveltrustNetworkAnnouncements";
import { trackTravelTrustEvent } from "@/lib/analytics";
import { TT_CINEMATIC_EASE } from "./traveltrustCinematicMotion";
import {
  TT_PULSE_GRADIENT_L5,
  TT_PULSE_KIND_L5,
  TT_PULSE_TICKER_L5,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrustCinematicNonGlobeL5";

const KIND_STYLE: Record<TravelTrustAnnouncement["kind"], string> = TT_PULSE_KIND_L5;

function TickerItem({ item }: { item: TravelTrustAnnouncement }) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const label = t(`traveltrust_pulse_kind_${item.kind}`);
  const bodyText = t(item.messageKey);
  const body = (
    <>
      <span className={`shrink-0 font-mono text-[10px] uppercase tracking-wide ${KIND_STYLE[item.kind]}`}>
        {label}
      </span>
      <span className={TT_PULSE_TICKER_L5.itemSeparatorClass} aria-hidden>
        ·
      </span>
      <span className={TT_PULSE_TICKER_L5.itemBodyClass}>{bodyText}</span>
      <span className={TT_PULSE_TICKER_L5.itemDateClass}>{item.at}</span>
    </>
  );

  const className = TT_PULSE_TICKER_L5.itemClass;

  if (item.href) {
    return (
      <motion.div whileHover={reduceMotion ? undefined : TT_PULSE_TICKER_L5.itemHover} whileTap={reduceMotion ? undefined : TT_PULSE_TICKER_L5.itemTap}>
        <Link
          href={item.href}
          className={className}
          title={bodyText}
          onClick={() =>
            trackTravelTrustEvent("traveltrust_secondary_cta_click", { source: "pulse", target: item.href ?? "" })
          }
        >
          {body}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.span className={className} title={bodyText} whileHover={reduceMotion ? undefined : TT_PULSE_TICKER_L5.itemHover}>
      {body}
    </motion.span>
  );
}

type PulseVariant = "section" | "inline";

type Props = {
  /** inline = 并入 landing chrome，减首屏横条（TT-PH1-155） */
  variant?: PulseVariant;
};

/** Web3 数字公告栏 — 项目进度 / 活动 / 治理（电影页顶 HUD） */
export function TravelTrustPulseTicker({ variant = "section" }: Props) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const inline = variant === "inline";
  const useStaticInline = inline && (TT_PULSE_TICKER_L5.inlineUsesStaticScroll || reduceMotion);
  const items = useMemo(
    () =>
      useStaticInline || reduceMotion
        ? [...TRAVELTRUST_NETWORK_ANNOUNCEMENTS]
        : [...TRAVELTRUST_NETWORK_ANNOUNCEMENTS, ...TRAVELTRUST_NETWORK_ANNOUNCEMENTS],
    [useStaticInline, reduceMotion],
  );
  const [marqueePaused, setMarqueePaused] = useState(false);
  const marqueeDuration = inline ? TT_PULSE_TICKER_L5.inlineMarqueeDuration : TT_PULSE_TICKER_L5.marqueeDuration;

  return (
    <motion.section
      id="pulse"
      className={
        inline
          ? TT_PULSE_TICKER_L5.inlineShellClass
          : "relative left-1/2 mb-3 w-screen max-w-[100vw] -translate-x-1/2 scroll-mt-28 border-y border-ref-sun/18"
      }
      style={{ background: TT_PULSE_GRADIENT_L5 }}
      data-tt-traveltrust-pulse-variant={variant}
      data-tt-traveltrust-pulse-scroll-mode={useStaticInline ? "static" : reduceMotion ? "static" : "marquee"}
      data-tt-traveltrust-pulse-anchor="1"
      aria-label={t("traveltrust_pulse_aria")}
      data-tt-traveltrust-pulse-ticker="1"
      data-tt-traveltrust-pulse-l5="1"
      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
      initial={reduceMotion ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: TT_PULSE_TICKER_L5.entranceDuration, ease: TT_CINEMATIC_EASE }}
    >
      {!inline && !reduceMotion ? (
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-30 motion-reduce:hidden"
          aria-hidden
          animate={{ opacity: [0.2, 0.45, 0.2] }}
          transition={{ duration: TT_PULSE_TICKER_L5.shimmerDuration, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background:
              "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(252,164,124,0.1) 2px, rgba(252,164,124,0.1) 4px)",
          }}
        />
      ) : null}
      {!inline && !reduceMotion ? (
        <motion.div
          className="pointer-events-none absolute left-0 top-0 h-0.5 w-24 bg-gradient-to-r from-ref-sun to-transparent motion-reduce:hidden"
          aria-hidden
          animate={{ x: ["-10%", "110%"] }}
          transition={{ duration: TT_PULSE_TICKER_L5.sweepDuration, repeat: Infinity, ease: "linear" }}
        />
      ) : null}
      <motion.div
        className={
          inline
            ? TT_PULSE_TICKER_L5.inlineRowClass
            : "mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 sm:px-6 lg:px-8 xl:px-12"
        }
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          delay: TT_PULSE_TICKER_L5.contentFadeDelay,
          duration: TT_PULSE_TICKER_L5.contentFadeDuration,
        }}
      >
        <span
          className={inline ? TT_PULSE_TICKER_L5.inlineLabelClass : "hidden shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-ref-sun/85 sm:inline"}
          data-tt-traveltrust-pulse-label-l5="1"
        >
          {t("traveltrust_pulse_label")}
        </span>
        {useStaticInline ? (
          <ul className={TT_PULSE_TICKER_L5.inlineStaticListClass} data-tt-traveltrust-pulse-inline-static-l5="1">
            {items.map((item) => (
              <li key={item.id} className={TT_PULSE_TICKER_L5.inlineStaticItemClass}>
                <TickerItem item={item} />
              </li>
            ))}
          </ul>
        ) : (
          <motion.div
            className={TT_PULSE_TICKER_L5.marqueeViewportClass}
            onMouseEnter={() => setMarqueePaused(true)}
            onMouseLeave={() => setMarqueePaused(false)}
            onFocusCapture={() => setMarqueePaused(true)}
            onBlurCapture={() => setMarqueePaused(false)}
          >
            {reduceMotion ? (
              <ul className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-3">
                {TRAVELTRUST_NETWORK_ANNOUNCEMENTS.map((item) => (
                  <li key={item.id}>
                    <TickerItem item={item} />
                  </li>
                ))}
              </ul>
            ) : (
              <motion.ul
                className={inline ? TT_PULSE_TICKER_L5.inlineMarqueeListClass : TT_PULSE_TICKER_L5.marqueeListClass}
                style={{ willChange: marqueePaused ? undefined : "transform" }}
                animate={marqueePaused ? undefined : { x: ["0%", "-50%"] }}
                transition={{ duration: marqueeDuration, repeat: Infinity, ease: "linear" }}
              >
                {items.map((item, i) => (
                  <li key={`${item.id}-${i}`} className={TT_PULSE_TICKER_L5.marqueeItemClass}>
                    <TickerItem item={item} />
                  </li>
                ))}
              </motion.ul>
            )}
          </motion.div>
        )}
      </motion.div>
    </motion.section>
  );
}
