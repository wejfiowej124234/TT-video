"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { TRAVELTRUST_NETWORK_ANNOUNCEMENTS, type TravelTrustAnnouncement } from "@/lib/traveltrustNetworkAnnouncements";
import { trackTravelTrustEvent } from "@/lib/analytics";
import { TT_CINEMATIC_EASE } from "./traveltrustCinematicMotion";

const KIND_STYLE: Record<TravelTrustAnnouncement["kind"], string> = {
  release: "text-ref-cyan",
  governance: "text-ref-teal",
  campaign: "text-ref-coral",
  ops: "text-slate-300",
};

function TickerItem({ item }: { item: TravelTrustAnnouncement }) {
  const { t } = useTranslation();
  const label = t(`traveltrust_pulse_kind_${item.kind}`);
  const body = (
    <>
      <span className={`shrink-0 font-mono text-[10px] uppercase tracking-wide ${KIND_STYLE[item.kind]}`}>
        {label}
      </span>
      <span className="shrink-0 text-slate-600" aria-hidden>
        ·
      </span>
      <span className="truncate text-slate-200">{t(item.messageKey)}</span>
      <span className="shrink-0 font-mono text-[10px] text-slate-500">{item.at}</span>
    </>
  );

  const className =
    "inline-flex max-w-[min(100%,420px)] items-center gap-2 rounded-md border border-white/8 bg-white/[0.03] px-2.5 py-1.5 text-meta backdrop-blur-sm sm:gap-2.5 sm:px-3";

  if (item.href) {
    return (
      <Link
        href={item.href}
        className={`${className} transition hover:border-ref-cyan/35 hover:bg-ref-cyan/5 motion-sub motion-reduce:transition-none`}
        onClick={() =>
          trackTravelTrustEvent("traveltrust_secondary_cta_click", { source: "pulse", target: item.href ?? "" })
        }
      >
        {body}
      </Link>
    );
  }

  return <span className={className}>{body}</span>;
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
  const items = useMemo(() => [...TRAVELTRUST_NETWORK_ANNOUNCEMENTS, ...TRAVELTRUST_NETWORK_ANNOUNCEMENTS], []);
  const inline = variant === "inline";

  return (
    <motion.section
      id="pulse"
      className={
        inline
          ? "scroll-mt-28 max-h-9 border-b-0 bg-[linear-gradient(90deg,rgba(35,206,217,0.04),transparent_55%,rgba(252,164,124,0.03))]"
          : "relative left-1/2 mb-3 w-screen max-w-[100vw] -translate-x-1/2 scroll-mt-28 border-y border-ref-cyan/15 bg-[linear-gradient(90deg,rgba(35,206,217,0.06),transparent_42%,rgba(252,164,124,0.05))]"
      }
      data-tt-traveltrust-pulse-variant={variant}
      data-tt-traveltrust-pulse-anchor="1"
      aria-label={t("traveltrust_pulse_aria")}
      data-tt-traveltrust-pulse-ticker="1"
      initial={reduceMotion ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: TT_CINEMATIC_EASE }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-30 motion-reduce:hidden"
        aria-hidden
        animate={{ opacity: [0.2, 0.45, 0.2] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background:
            "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(35,206,217,0.12) 2px, rgba(35,206,217,0.12) 4px)",
        }}
      />
      <motion.div
        className="pointer-events-none absolute left-0 top-0 h-0.5 w-24 bg-gradient-to-r from-ref-cyan to-transparent motion-reduce:hidden"
        aria-hidden
        animate={{ x: ["-10%", "110%"] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className={`flex items-center gap-3 ${inline ? "w-full min-w-0 px-0 py-0.5 sm:gap-4" : "mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8 xl:px-12"}`}
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <span
          className={`shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-ref-cyan/80 ${inline ? "inline max-[480px]:hidden" : "hidden sm:inline"}`}
        >
          {t("traveltrust_pulse_label")}
        </span>
        <div className="relative min-w-0 flex-1 overflow-hidden mask-[linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
          {reduceMotion ? (
            <ul className="flex flex-col gap-1 sm:flex-row sm:flex-wrap">
              {TRAVELTRUST_NETWORK_ANNOUNCEMENTS.map((item) => (
                <li key={item.id}>
                  <TickerItem item={item} />
                </li>
              ))}
            </ul>
          ) : (
            <motion.ul
              className="flex w-max gap-3 pr-3"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 42, repeat: Infinity, ease: "linear" }}
            >
              {items.map((item, i) => (
                <li key={`${item.id}-${i}`}>
                  <TickerItem item={item} />
                </li>
              ))}
            </motion.ul>
          )}
        </div>
      </motion.div>
    </motion.section>
  );
}
