"use client";

import { motion, useReducedMotion } from "framer-motion";
import { TT_TRAVELTRUST_SECTION_A11Y } from "./traveltrustSectionA11yIds";
import { useTranslation } from "@/components/LocaleProvider";
import { TRAVELTRUST_ILLUSTRATIVE_STATS } from "@/lib/traveltrustIllustrativeStats";
import { TravelTrustIllustrativeStatValue } from "./TravelTrustIllustrativeStatValue";
export function TravelTrustIllustrativeStats() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const titleId = TT_TRAVELTRUST_SECTION_A11Y.stats.title;
  const noteId = TT_TRAVELTRUST_SECTION_A11Y.stats.note;

  return (
    <motion.section
      id="stats"
      className="scroll-mt-28 border-t border-white/10 py-8 sm:py-10"
      aria-labelledby={titleId}
      aria-describedby={noteId}
      data-tt-traveltrust-illustrative-stats="1"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 0.4 }}
    >
      <h2
        id={titleId}
        className="text-small font-semibold uppercase tracking-[0.16em] text-slate-400"
      >
        {t("traveltrust_stats_strip_title")}
      </h2>
      <motion.div
        className="mt-5 grid gap-4 sm:grid-cols-3"
        initial={reduceMotion ? false : { opacity: 0 }}
        whileInView={reduceMotion ? undefined : { opacity: 1 }}
        viewport={{ once: true }}
      >
        {TRAVELTRUST_ILLUSTRATIVE_STATS.map((stat) => {
          const footnoteId = `traveltrust-stat-footnote-${stat.id}`;
          return (
            <motion.dl
              key={stat.id}
              className="rounded-lg border border-white/8 bg-ink-900/30 px-4 py-3"
              data-tt-traveltrust-stat-id={stat.id}
              data-tt-traveltrust-stat-illustrative="1"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35 }}
            >
              <dt className="text-meta text-slate-500">{t(stat.labelKey)}</dt>
              <TravelTrustIllustrativeStatValue
                valueKey={stat.valueKey}
                footnoteId={footnoteId}
                statId={stat.id}
              />
              <dd
                id={footnoteId}
                className="mt-2 text-[11px] leading-relaxed text-slate-500"
                data-tt-traveltrust-stat-footnote={stat.id}
              >
                {t(stat.footnoteKey)}
              </dd>
            </motion.dl>
          );
        })}
      </motion.div>
      <p id={noteId} className="mt-4 text-meta text-slate-500">
        {t("traveltrust_stats_strip_note")}
      </p>
    </motion.section>
  );
}
