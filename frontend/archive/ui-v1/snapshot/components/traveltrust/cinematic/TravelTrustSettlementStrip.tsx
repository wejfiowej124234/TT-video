"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { TT_TRAVELTRUST_SECTION_A11Y } from "./traveltrustSectionA11yIds";
import { useTranslation } from "@/components/LocaleProvider";
import { trackTravelTrustEvent } from "@/lib/analytics";
/** 轻量 Settlement 叙事（非 17 段恢复；链到 help / pay） */
export function TravelTrustSettlementStrip() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const titleId = TT_TRAVELTRUST_SECTION_A11Y.settlement.title;
  const [protocolOpen, setProtocolOpen] = useState(false);

  return (
    <motion.section
      id="settlement"
      className="scroll-mt-28 border-t border-white/10 py-8 sm:py-10"
      aria-labelledby={titleId}
      data-tt-traveltrust-settlement-strip="1"
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 0.4 }}
    >
      <p className="text-kicker font-semibold uppercase tracking-[0.2em] text-ref-teal/80">
        {t("traveltrust_settlement_eyebrow")}
      </p>
      <h2 id={titleId} className="mt-2 text-h4 font-bold text-white">
        {t("traveltrust_settlement_title")}
      </h2>
      <p className="mt-3 max-w-2xl text-meta leading-relaxed text-slate-400">
        {t("traveltrust_settlement_body")}
      </p>
      <motion.div className="mt-4 max-w-2xl" data-tt-traveltrust-settlement-protocol="1">
        <button
          type="button"
          className="inline-flex min-h-[40px] items-center gap-2 text-meta font-medium text-slate-400 transition hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/50"
          aria-expanded={protocolOpen}
          aria-controls="traveltrust-settlement-protocol-panel"
          data-tt-traveltrust-settlement-protocol-toggle="1"
          onClick={() => setProtocolOpen((o) => !o)}
        >
          {protocolOpen
            ? t("traveltrust_settlement_protocol_toggle_collapse")
            : t("traveltrust_settlement_protocol_toggle_expand")}
          <span aria-hidden className="text-slate-500">
            {protocolOpen ? "−" : "+"}
          </span>
        </button>
        <AnimatePresence initial={false}>
          {protocolOpen ? (
            <motion.p
              id="traveltrust-settlement-protocol-panel"
              initial={reduceMotion ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden text-[11px] leading-relaxed text-slate-500"
              data-tt-traveltrust-settlement-disclaimer="1"
            >
              {t("traveltrust_settlement_disclaimer")}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </motion.div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/help"
          onClick={() =>
            trackTravelTrustEvent("traveltrust_secondary_cta_click", {
              source: "settlement",
              target: "/help",
            })
          }
          className="inline-flex min-h-[44px] items-center rounded-lg border border-white/15 px-4 py-2 text-small font-medium text-slate-200 hover:border-ref-cyan/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/50"
        >
          {t("traveltrust_nav_help")} →
        </Link>
        <Link
          href="/pay"
          onClick={() =>
            trackTravelTrustEvent("traveltrust_secondary_cta_click", {
              source: "settlement",
              target: "/pay",
            })
          }
          className="inline-flex min-h-[44px] items-center rounded-lg border border-white/15 px-4 py-2 text-small font-medium text-slate-200 hover:border-ref-coral/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/50"
        >
          {t("traveltrust_liquidity_escrow_link")} →
        </Link>
      </div>
    </motion.section>
  );
}
