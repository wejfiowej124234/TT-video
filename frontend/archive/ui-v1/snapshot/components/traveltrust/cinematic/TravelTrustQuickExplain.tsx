"use client";

import { motion, useReducedMotion } from "framer-motion";
import { TT_TRAVELTRUST_SECTION_A11Y } from "./traveltrustSectionA11yIds";
import { useTranslation } from "@/components/LocaleProvider";
const STEPS = [
  { key: "traveltrust_explain_step1", num: "01" },
  { key: "traveltrust_explain_step2", num: "02" },
  { key: "traveltrust_explain_step3", num: "03" },
] as const;

function splitExplainStep(text: string): { title: string; detail: string | null } {
  const parts = text.split(/\s*[—–-]\s*/);
  if (parts.length < 2) return { title: text, detail: null };
  return { title: parts[0]!.trim(), detail: parts.slice(1).join(" — ").trim() };
}

export function TravelTrustQuickExplain() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const titleId = TT_TRAVELTRUST_SECTION_A11Y.explain.title;

  return (
    <motion.section
      id="explain"
      className="scroll-mt-28 border-t border-white/10 py-10 sm:py-12"
      aria-labelledby={titleId}
      data-tt-traveltrust-quick-explain="1"
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 0.45 }}
    >
      <motion.p id={titleId} className="text-h4 font-bold text-white sm:text-h3">
        {t("traveltrust_explain_title")}
      </motion.p>
      <ol className="mt-8 grid gap-4 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <motion.li
            key={step.key}
            className="rounded-xl border border-white/10 border-l-2 border-l-ref-cyan/40 bg-ink-900/40 p-4 pl-5 backdrop-blur-sm transition hover:border-ref-cyan/35 hover:bg-ink-900/55 hover:shadow-[0_0_28px_-10px_rgba(35,206,217,0.28)] motion-sub motion-reduce:transition-none"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            <span className="text-meta font-semibold tracking-widest text-ref-cyan/70">{step.num}</span>
            {(() => {
              const { title, detail } = splitExplainStep(t(step.key));
              return (
                <>
                  <p className="mt-2 text-body font-semibold leading-snug text-white">{title}</p>
                  {detail ? (
                    <p className="mt-2 text-small leading-relaxed text-slate-400">{detail}</p>
                  ) : null}
                </>
              );
            })()}
          </motion.li>
        ))}
      </ol>
      <p className="mt-6 max-w-2xl text-meta leading-relaxed text-slate-500" data-tt-traveltrust-explain-disclaimer="1">
        {t("traveltrust_explain_disclaimer")}
      </p>
    </motion.section>
  );
}
