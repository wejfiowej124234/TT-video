"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { TT_TRAVELTRUST_SECTION_A11Y } from "./traveltrustSectionA11yIds";
import { useTranslation } from "@/components/LocaleProvider";
import { trackTravelTrustEvent } from "@/lib/analytics";
const FACTS = [
  { key: "traveltrust_trust_fact_escrow", href: "/help", event: "help" },
  { key: "traveltrust_trust_fact_governance", href: "/governance", event: "governance" },
  { key: "traveltrust_trust_fact_protocol", href: "/governance/params", event: "protocol_reference" },
  { key: "traveltrust_trust_fact_disclosure", href: "/help", event: "disclosure" },
] as const;

export function TravelTrustTrustFactsStrip() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const titleId = TT_TRAVELTRUST_SECTION_A11Y.trust.title;

  return (
    <motion.section
      id="trust"
      className="scroll-mt-28 border-t border-white/10 py-10 sm:py-12"
      aria-labelledby={titleId}
      data-tt-traveltrust-trust-facts="1"
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 0.45 }}
    >
      <p className="text-kicker font-semibold uppercase tracking-[0.2em] text-ref-teal/80">
        {t("traveltrust_trust_eyebrow")}
      </p>
      <h2 id={titleId} className="mt-3 max-w-2xl text-h4 font-bold text-white sm:text-h3">
        {t("traveltrust_trust_strip_heading")}
      </h2>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {FACTS.map((fact, i) => (
          <motion.li
            key={fact.key}
            initial={reduceMotion ? false : { opacity: 0, x: -12 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: i * 0.06 }}
          >
            <Link
              href={fact.href}
              onClick={() =>
                trackTravelTrustEvent("traveltrust_secondary_cta_click", {
                  source: "trust_facts",
                  target: fact.href,
                  role: fact.event,
                })
              }
              className="group flex min-h-[52px] items-center gap-3 rounded-xl border border-white/10 bg-ink-900/35 px-4 py-3 text-small text-slate-200 transition hover:border-ref-cyan/40 hover:bg-ink-900/55 hover:shadow-[0_0_24px_-8px_rgba(35,206,217,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/60 motion-sub motion-reduce:transition-none"
            >
              <motion.span
                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ref-cyan/15 text-meta font-bold text-ref-cyan ring-1 ring-ref-cyan/25"
                aria-hidden
                initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
                whileInView={reduceMotion ? undefined : { scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.05, type: "spring", stiffness: 320, damping: 22 }}
              >
                ✓
              </motion.span>
              <span className="flex-1 group-hover:text-white">{t(fact.key)}</span>
              <span
                className="shrink-0 text-meta text-ref-cyan/70 transition group-hover:translate-x-0.5 group-hover:text-ref-cyan"
                aria-hidden
              >
                →
              </span>
            </Link>
          </motion.li>
        ))}
      </ul>
      <p className="mt-4 max-w-2xl text-meta leading-relaxed text-slate-500" data-tt-traveltrust-trust-facts-disclaimer="1">
        {t("traveltrust_trust_facts_disclaimer")}
      </p>
    </motion.section>
  );
}
