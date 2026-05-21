"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { TT_TRAVELTRUST_SECTION_A11Y } from "./traveltrustSectionA11yIds";
import { useTranslation } from "@/components/LocaleProvider";
import { trackTravelTrustEvent } from "@/lib/analytics";
import { TrustChipIcon } from "./TrustChipIcon";
import { traveltrustSectionChildStagger, traveltrustSectionMotionProps } from "./traveltrustSectionMotion";
import {
  TT_SECTION_CONTENT_L5,
  TT_SECTION_KICKER_L5,
  TT_SECTION_SURFACE_L5,
  TT_TRUST_FACTS_L5,
  traveltrustSectionL5DataAttrs,
} from "@/lib/traveltrustCinematicNonGlobeL5";

const FACTS = [
  {
    titleKey: "traveltrust_trust_fact_escrow_title",
    summaryKey: "traveltrust_trust_fact_escrow_summary",
    href: "/help",
    event: "help",
    icon: "escrow" as const,
  },
  {
    titleKey: "traveltrust_trust_fact_governance_title",
    summaryKey: "traveltrust_trust_fact_governance_summary",
    href: "/governance",
    event: "governance",
    icon: "governance" as const,
  },
  {
    titleKey: "traveltrust_trust_fact_protocol_title",
    summaryKey: "traveltrust_trust_fact_protocol_summary",
    href: "/governance/params",
    event: "protocol_reference",
    icon: "destination" as const,
  },
  {
    titleKey: "traveltrust_trust_fact_disclosure_title",
    summaryKey: "traveltrust_trust_fact_disclosure_summary",
    href: "/help#disclosure",
    event: "disclosure",
    icon: "compliance" as const,
  },
] as const;

export function TravelTrustTrustFactsStrip() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const titleId = TT_TRAVELTRUST_SECTION_A11Y.trust.title;
  const sectionMotion = traveltrustSectionMotionProps("trust", reduceMotion);

  return (
    <motion.section
      id="trust"
      className={TT_SECTION_SURFACE_L5.trust}
      aria-labelledby={titleId}
      data-tt-traveltrust-trust-facts="1"
      data-tt-traveltrust-trust-facts-l5="1"
      {...traveltrustSectionL5DataAttrs("trust")}
      initial={sectionMotion.initial}
      whileInView={sectionMotion.whileInView}
      viewport={sectionMotion.viewport}
      transition={sectionMotion.transition}
    >
      <motion.div
        className={TT_SECTION_SURFACE_L5.trustAtmosphere}
        aria-hidden
        data-tt-traveltrust-trust-atmosphere-l5="1"
        initial={reduceMotion ? false : { opacity: 0 }}
        whileInView={reduceMotion ? undefined : { opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: TT_TRUST_FACTS_L5.atmosphereEntranceDuration }}
      />
      <div
        className={TT_SECTION_CONTENT_L5.bodyClass}
        data-tt-traveltrust-trust-faq-liquidity-surface-l5="1"
      >
      <p className={TT_SECTION_KICKER_L5}>{t("traveltrust_trust_eyebrow")}</p>
      <h2 id={titleId} className={`${TT_SECTION_CONTENT_L5.kickerToHeadingClass} ${TT_SECTION_CONTENT_L5.headingClass}`}>
        {t("traveltrust_trust_strip_heading")}
      </h2>
      <div className={TT_TRUST_FACTS_L5.warmPlateClass} data-tt-traveltrust-trust-warm-plate-l5="1">
      <ul className={TT_SECTION_CONTENT_L5.cardGridClass}>
        {FACTS.map((fact, i) => (
          <motion.li
            key={fact.titleKey}
            initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.98 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
            whileTap={reduceMotion ? undefined : TT_TRUST_FACTS_L5.cardTap}
            viewport={{ once: true }}
            transition={traveltrustSectionChildStagger(i, reduceMotion, TT_TRUST_FACTS_L5.childStaggerBase)}
            data-tt-traveltrust-trust-facts-card-tap-l5="1"
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
              className={TT_TRUST_FACTS_L5.cardHoverClass}
              data-tt-traveltrust-trust-fact-l5="1"
              data-tt-traveltrust-trust-fact-card={fact.event}
            >
              {!reduceMotion ? (
                <motion.span
                  className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-ref-sun/20"
                  aria-hidden
                  animate={{ opacity: TT_TRUST_FACTS_L5.cardBorderPulse.opacity }}
                  transition={{
                    duration: TT_TRUST_FACTS_L5.cardBorderPulse.duration,
                    repeat: TT_TRUST_FACTS_L5.cardBorderPulse.repeat,
                    ease: "easeInOut",
                  }}
                />
              ) : null}
              <span className={TT_TRUST_FACTS_L5.cardTitleRowClass}>
                <motion.span
                  className={TT_TRUST_FACTS_L5.cardIconWrapClass}
                  whileHover={reduceMotion ? undefined : { scale: 1.06 }}
                  animate={
                    reduceMotion
                      ? undefined
                      : { boxShadow: TT_TRUST_FACTS_L5.iconGlowShadow }
                  }
                  transition={
                    reduceMotion
                      ? TT_TRUST_FACTS_L5.iconHoverTransition
                      : {
                          duration: TT_TRUST_FACTS_L5.iconPulseDuration,
                          repeat: TT_TRUST_FACTS_L5.iconPulseRepeat,
                          ease: "easeInOut",
                        }
                  }
                >
                  <TrustChipIcon kind={fact.icon} className="h-4 w-4" />
                </motion.span>
                <span className="min-w-0 flex-1 pt-0.5 text-small font-semibold leading-snug text-white group-hover:text-ref-sun/95">
                  {t(fact.titleKey)}
                </span>
                <span
                  className="shrink-0 pt-0.5 text-meta text-ref-sun/70 transition group-hover:translate-x-0.5 group-hover:text-ref-sun"
                  aria-hidden
                >
                  →
                </span>
              </span>
              <span className={`${TT_TRUST_FACTS_L5.cardSummaryIndentClass} ${TT_TRUST_FACTS_L5.cardSummaryClass}`}>
                {t(fact.summaryKey)}
              </span>
            </Link>
          </motion.li>
        ))}
      </ul>
      </div>
      <p className={TT_SECTION_CONTENT_L5.disclaimerClass} data-tt-traveltrust-trust-facts-disclaimer="1">
        {t("traveltrust_trust_facts_disclaimer")}
      </p>
      </div>
    </motion.section>
  );
}
