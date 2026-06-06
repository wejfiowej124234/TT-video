"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useRef, useState } from "react";
import { TT_TRAVELTRUST_SECTION_A11Y } from "./traveltrustSectionA11yIds";
import { useTranslation } from "@/components/LocaleProvider";
const FAQ_ITEMS = [
  { q: "traveltrust_faq_q1", a: "traveltrust_faq_a1" },
  { q: "traveltrust_faq_q2", a: "traveltrust_faq_a2" },
  { q: "traveltrust_faq_q3", a: "traveltrust_faq_a3" },
  { q: "traveltrust_faq_q4", a: "traveltrust_faq_a4" },
] as const;

export function TravelTrustFaqStrip() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const titleId = TT_TRAVELTRUST_SECTION_A11Y.faq.title;
  const listId = TT_TRAVELTRUST_SECTION_A11Y.faq.list;
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusButton = useCallback((idx: number) => {
    buttonRefs.current[idx]?.focus();
  }, []);

  const toggleItem = useCallback((i: number) => {
    setOpenIdx((prev) => (prev === i ? null : i));
  }, []);

  const onAccordionKeyDown = useCallback(
    (e: React.KeyboardEvent, i: number) => {
      const last = FAQ_ITEMS.length - 1;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        toggleItem(i);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = i < last ? i + 1 : 0;
        setOpenIdx(next);
        focusButton(next);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = i > 0 ? i - 1 : last;
        setOpenIdx(prev);
        focusButton(prev);
      } else if (e.key === "Home") {
        e.preventDefault();
        setOpenIdx(0);
        focusButton(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setOpenIdx(last);
        focusButton(last);
      }
    },
    [focusButton, toggleItem],
  );

  return (
    <motion.section
      id="faq"
      className="scroll-mt-28 border-t border-white/10 py-10 sm:py-12"
      aria-labelledby={titleId}
      data-tt-traveltrust-faq-strip="1"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 0.4 }}
    >
      <h2 id={titleId} className="text-h4 font-bold text-white sm:text-h3">
        {t("traveltrust_faq_title")}
      </h2>
      <p id={TT_TRAVELTRUST_SECTION_A11Y.faq.intro} className="mt-2 max-w-2xl text-meta text-slate-500">
        {t("traveltrust_faq_intro")}
      </p>
      <div
        id={listId}
        role="region"
        aria-labelledby={titleId}
        aria-describedby={TT_TRAVELTRUST_SECTION_A11Y.faq.intro}
        className="mt-6"
        data-tt-traveltrust-faq-accordion="1"
      >
        <ul className="space-y-2">
          {FAQ_ITEMS.map(({ q: qKey, a: aKey }, i) => {
            const open = openIdx === i;
            const panelId = `traveltrust-faq-panel-${i}`;
            const buttonId = `traveltrust-faq-button-${i}`;
            return (
              <li
                key={qKey}
                className="overflow-hidden rounded-xl border border-white/10 bg-ink-900/35"
              >
                <button
                  id={buttonId}
                  ref={(el) => {
                    buttonRefs.current[i] = el;
                  }}
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-small font-semibold text-slate-100 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ref-cyan/50"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => toggleItem(i)}
                  onKeyDown={(e) => onAccordionKeyDown(e, i)}
                  data-tt-traveltrust-faq-trigger={String(i)}
                >
                  {t(qKey)}
                  <span className="shrink-0 text-slate-500" aria-hidden>
                    {open ? "−" : "+"}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {open ? (
                    <motion.div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden border-t border-white/8"
                    >
                      <p className="px-4 py-3 text-meta leading-relaxed text-slate-400">{t(aKey)}</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </motion.section>
  );
}
