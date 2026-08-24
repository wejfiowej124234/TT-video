"use client";
import "./TravelTrustAnnouncementSurfaceGlow.css";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useLayoutEffect, useMemo, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { useTraveltrustPulseAnnouncements } from "@/lib/hooks/useTraveltrustCmsAnnouncements";
import { traveltrustAnnouncementListText } from "@/lib/traveltrustCmsAnnouncements";
import {
  traveltrustAnnouncementPageHref,
  type TravelTrustAnnouncement,
} from "@/lib/traveltrustNetworkAnnouncements";
import { trackTravelTrustEvent } from "@/lib/analytics";
import { TT_CINEMATIC_EASE } from "./traveltrustCinematicMotion";
import {
  TT_PULSE_GRADIENT_L5,
  TT_PULSE_KIND_L5,
  TT_PULSE_TICKER_L5,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrust/l5";

const KIND_STYLE: Record<TravelTrustAnnouncement["kind"], string> = TT_PULSE_KIND_L5;

function pulseChipPlateClass(item: TravelTrustAnnouncement): string {
  if (item.kind === "campaign") return TT_PULSE_TICKER_L5.itemPlateCampaignClass;
  if (item.lane === "protocol_status") return TT_PULSE_TICKER_L5.itemPlateProtocolClass;
  if (item.lane === "governance") return TT_PULSE_TICKER_L5.itemPlateGovernanceClass;
  return TT_PULSE_TICKER_L5.itemPlateProductClass;
}

function TickerItem({ item, inline = false }: { item: TravelTrustAnnouncement; inline?: boolean }) {
  const { t, locale } = useTranslation();
  const reduceMotion = useReducedMotion();
  const label = t(`traveltrust_pulse_kind_${item.kind}`);
  const bodyText =
    "cmsCopy" in item && item.cmsCopy
      ? traveltrustAnnouncementListText(item as import("@/lib/traveltrustCmsAnnouncements").TravelTrustAnnouncementDisplay, locale)
      : t(item.messageKey);
  const target = traveltrustAnnouncementPageHref(item.id);
  const body = (
    <>
      <span className={TT_PULSE_TICKER_L5.itemShimmerClass} aria-hidden />
      <span className={`${TT_PULSE_TICKER_L5.itemKindClass} ${KIND_STYLE[item.kind]}`}>
        {label}
      </span>
      <span className={TT_PULSE_TICKER_L5.itemSeparatorClass} aria-hidden>
        ·
      </span>
      <span className={TT_PULSE_TICKER_L5.itemBodyClass}>{bodyText}</span>
    </>
  );

  const className = `${TT_PULSE_TICKER_L5.itemClass} ${pulseChipPlateClass(item)}`;
  const link = (
    <Link
      href={target}
      className={className}
      title={bodyText}
      prefetch
      onClick={() =>
        trackTravelTrustEvent("traveltrust_secondary_cta_click", {
          source: "pulse_ticker",
          target,
        })
      }
    >
      {body}
    </Link>
  );

  if (inline || reduceMotion) {
    return <div className="shrink-0">{link}</div>;
  }

  return (
    <motion.div whileHover={TT_PULSE_TICKER_L5.itemHover} whileTap={TT_PULSE_TICKER_L5.itemTap}>
      {link}
    </motion.div>
  );
}

type PulseVariant = "section" | "inline";

type Props = {
  /** inline = 并入 landing chrome，减首屏横条（TT-PH1-155） */
  variant?: PulseVariant;
};

/** Web3 数字公告栏 — 产品 / 信任 / 社区 / 活动（用户转化向） */
export function TravelTrustPulseTicker({ variant = "section" }: Props) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const inline = variant === "inline";
  const [inlineMobileStatic, setInlineMobileStatic] = useState(false);
  useLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setInlineMobileStatic(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  const useStaticInline =
    inline && (reduceMotion || TT_PULSE_TICKER_L5.inlineUsesStaticScroll || inlineMobileStatic);
  const inlineScrollMode = useStaticInline ? "static" : "marquee";
  const { items: pulseItems } = useTraveltrustPulseAnnouncements();
  const visibleAnnouncements = pulseItems;
  const items = useMemo(
    () =>
      useStaticInline || reduceMotion
        ? visibleAnnouncements
        : [...visibleAnnouncements, ...visibleAnnouncements],
    [useStaticInline, reduceMotion, visibleAnnouncements],
  );
  const [marqueePaused, setMarqueePaused] = useState(false);
  const marqueeDuration = inline ? TT_PULSE_TICKER_L5.inlineMarqueeDuration : TT_PULSE_TICKER_L5.marqueeDuration;
  const allHref = traveltrustAnnouncementPageHref();
  const skipEntrance = inline || reduceMotion;

  const tickerRow = (
    <>
      <div
        className={
          inline
            ? TT_PULSE_TICKER_L5.labelClusterClass
            : `hidden sm:flex ${TT_PULSE_TICKER_L5.labelClusterClass}`
        }
        data-tt-traveltrust-pulse-label-cluster-l5="1"
      >
        <span
          className={
            inline
              ? TT_PULSE_TICKER_L5.inlineLabelClass
              : "font-mono text-[10px] uppercase tracking-[0.16em] text-ref-sun/85"
          }
          data-tt-traveltrust-pulse-label-l5="1"
        >
          {t("traveltrust_pulse_label")}
        </span>
        <span className={TT_PULSE_TICKER_L5.labelSeparatorClass} aria-hidden>
          ·
        </span>
        <Link
          href={allHref}
          className={TT_PULSE_TICKER_L5.viewAllLinkClass}
          prefetch
          data-tt-traveltrust-pulse-view-all="1"
          onClick={() =>
            trackTravelTrustEvent("traveltrust_secondary_cta_click", {
              source: "pulse_view_all",
              target: allHref,
            })
          }
        >
          <span>{t("traveltrust_pulse_view_all")}</span>
          <span className={TT_PULSE_TICKER_L5.viewAllChevronClass} aria-hidden>
            ›
          </span>
        </Link>
      </div>
      {useStaticInline ? (
        <div className="min-w-0 flex-1 overflow-hidden max-w-full">
          <ul className={TT_PULSE_TICKER_L5.inlineStaticListClass} data-tt-traveltrust-pulse-inline-static-l5="1">
            {items.map((item) => (
              <li key={item.id} className={TT_PULSE_TICKER_L5.inlineStaticItemClass}>
                <TickerItem item={item} inline />
              </li>
            ))}
          </ul>
        </div>
      ) : inline ? (
        <div
          className={`${TT_PULSE_TICKER_L5.inlineMarqueeViewportClass} max-w-full [contain:paint]`}
          data-tt-traveltrust-pulse-inline-marquee-l5="1"
        >
          <ul className={TT_PULSE_TICKER_L5.inlineMarqueeTrackClass}>
            {items.map((item, i) => (
              <li key={`${item.id}-${i}`} className={TT_PULSE_TICKER_L5.marqueeItemClass}>
                <TickerItem item={item} />
              </li>
            ))}
          </ul>
        </div>
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
              {visibleAnnouncements.map((item) => (
                <li key={item.id}>
                  <TickerItem item={item} />
                </li>
              ))}
            </ul>
          ) : (
            <motion.ul
              className={TT_PULSE_TICKER_L5.marqueeListClass}
              initial={false}
              style={{ willChange: marqueePaused ? undefined : "transform" }}
              animate={marqueePaused ? undefined : { x: ["0%", "-50%"] }}
              transition={{
                duration: marqueeDuration,
                repeat: Infinity,
                ease: "linear",
                repeatType: "loop",
              }}
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
    </>
  );

  if (inline) {
    return (
      <section
        id="pulse"
        className={TT_PULSE_TICKER_L5.inlineShellClass}
        style={{ background: TT_PULSE_GRADIENT_L5 }}
        data-tt-traveltrust-pulse-variant={variant}
        data-tt-traveltrust-pulse-scroll-mode={inlineScrollMode}
        data-tt-traveltrust-pulse-anchor="1"
        aria-label={t("traveltrust_pulse_aria")}
        data-tt-home-module="M03"
        data-tt-traveltrust-pulse-ticker="1"
        data-tt-traveltrust-pulse-l5="1"
        data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
      >
        <div className={TT_PULSE_TICKER_L5.inlineRowMarqueeClass}>
          {tickerRow}
        </div>
      </section>
    );
  }

  return (
    <motion.section
      id="pulse"
      className="relative left-1/2 mb-3 w-full max-w-[100vw] -translate-x-1/2 scroll-mt-28 border-y border-ref-sun/18 overflow-x-clip"
      style={{ background: TT_PULSE_GRADIENT_L5 }}
      data-tt-traveltrust-pulse-variant={variant}
      data-tt-traveltrust-pulse-scroll-mode={reduceMotion ? "static" : "marquee"}
      data-tt-traveltrust-pulse-anchor="1"
      aria-label={t("traveltrust_pulse_aria")}
      data-tt-home-module="M03"
      data-tt-traveltrust-pulse-ticker="1"
      data-tt-traveltrust-pulse-l5="1"
      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
      initial={skipEntrance ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: TT_PULSE_TICKER_L5.entranceDuration, ease: TT_CINEMATIC_EASE }}
    >
      {!reduceMotion ? (
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
      {!reduceMotion ? (
        <motion.div
          className="pointer-events-none absolute left-0 top-0 h-0.5 w-24 bg-gradient-to-r from-ref-sun to-transparent motion-reduce:hidden"
          aria-hidden
          animate={{ x: ["-10%", "110%"] }}
          transition={{ duration: TT_PULSE_TICKER_L5.sweepDuration, repeat: Infinity, ease: "linear" }}
        />
      ) : null}
      <motion.div
        className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 sm:px-6 lg:px-8 xl:px-12"
        initial={skipEntrance ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          delay: skipEntrance ? 0 : TT_PULSE_TICKER_L5.contentFadeDelay,
          duration: TT_PULSE_TICKER_L5.contentFadeDuration,
        }}
      >
        {tickerRow}
      </motion.div>
    </motion.section>
  );
}
