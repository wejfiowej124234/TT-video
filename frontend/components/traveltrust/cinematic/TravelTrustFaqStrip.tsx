"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useState } from "react";
import { TT_TRAVELTRUST_SECTION_A11Y } from "./traveltrustSectionA11yIds";
import { useTranslation } from "@/components/LocaleProvider";
import { traveltrustSectionChildStagger } from "./traveltrustSectionMotion";
import {
  TT_FAQ_ACCORDION_L5,
  TT_SECTION_CONTENT_L5,
  TT_SECTION_KICKER_L5,
  TT_SECTION_SURFACE_L5,
  traveltrustSectionL5DataAttrs,
} from "@/lib/traveltrust/l5";
import { TravelTrustFaqAnswerBody, TravelTrustFaqIntro } from "./TravelTrustFaqRichContent";

const FAQ_ITEMS = [
  { q: "traveltrust_faq_q1", a: "traveltrust_faq_a1" },
  { q: "traveltrust_faq_q6", a: "traveltrust_faq_a6" },
  { q: "traveltrust_faq_q7", a: "traveltrust_faq_a7" },
  { q: "traveltrust_faq_q8", a: "traveltrust_faq_a8" },
  { q: "traveltrust_faq_q2", a: "traveltrust_faq_a2" },
  { q: "traveltrust_faq_q3", a: "traveltrust_faq_a3" },
  { q: "traveltrust_faq_q4", a: "traveltrust_faq_a4", rich: true },
  { q: "traveltrust_faq_q9", a: "traveltrust_faq_a9" },
  { q: "traveltrust_faq_q10", a: "traveltrust_faq_a10", rich: true },
  { q: "traveltrust_faq_q11", a: "traveltrust_faq_a11" },
] as const;

type FaqItem = (typeof FAQ_ITEMS)[number];

function FaqAccordionItem({
  item,
  index,
  open,
  reduceMotion,
  onToggle,
  onTriggerKeyDown,
}: {
  item: FaqItem;
  index: number;
  open: boolean;
  reduceMotion: boolean | null;
  onToggle: (i: number) => void;
  onTriggerKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => void;
}) {
  const { t } = useTranslation();
  const { q: qKey, a: aKey } = item;
  const panelId = `traveltrust-faq-panel-${index}`;
  const buttonId = `traveltrust-faq-button-${index}`;

  return (
    <motion.li
      layout={!reduceMotion}
      className={`${TT_FAQ_ACCORDION_L5.itemShellClass} ${
        open ? TT_FAQ_ACCORDION_L5.itemOpen : TT_FAQ_ACCORDION_L5.itemIdle
      }`}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, scale: open ? 1.008 : 1 }}
      whileHover={reduceMotion ? undefined : { y: -1 }}
      whileTap={reduceMotion ? undefined : { scale: 0.992 }}
      viewport={{ once: true, margin: "-6% 0px" }}
      transition={traveltrustSectionChildStagger(index, reduceMotion, TT_FAQ_ACCORDION_L5.listStaggerBase)}
      data-tt-traveltrust-faq-item-hover-l5="1"
    >
      <button
        id={buttonId}
        type="button"
        className={`${TT_FAQ_ACCORDION_L5.triggerClass} ${
          open ? TT_FAQ_ACCORDION_L5.triggerOpen : TT_FAQ_ACCORDION_L5.triggerIdle
        }`}
        data-tt-traveltrust-faq-item-l5="1"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onToggle(index)}
        onKeyDown={(e) => onTriggerKeyDown(e, index)}
        data-tt-traveltrust-faq-trigger={String(index)}
        data-tt-traveltrust-faq-trigger-tap-l5="1"
      >
        <span className={TT_FAQ_ACCORDION_L5.questionTextClass}>{t(qKey)}</span>
        <motion.span
          className={TT_FAQ_ACCORDION_L5.iconSlotClass}
          aria-hidden
          animate={reduceMotion ? undefined : { rotate: open ? 45 : 0 }}
          transition={{ duration: TT_FAQ_ACCORDION_L5.iconRotateDuration, ease: [...TT_FAQ_ACCORDION_L5.panelEase] }}
        >
          +
        </motion.span>
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
            transition={{
              duration: reduceMotion ? 0 : TT_FAQ_ACCORDION_L5.panelDuration,
              ease: [...TT_FAQ_ACCORDION_L5.panelEase],
            }}
            className="relative overflow-hidden border-t border-ref-sun/12 bg-ref-sun/[0.02]"
          >
            {!reduceMotion ? (
              <motion.div
                className={TT_FAQ_ACCORDION_L5.openPanelShimmerClass}
                aria-hidden
                data-tt-traveltrust-faq-panel-shimmer-l5="1"
                initial={{ x: "-120%" }}
                animate={{ x: "120%" }}
                transition={{
                  duration: TT_FAQ_ACCORDION_L5.openPanelShimmerDuration,
                  repeat: TT_FAQ_ACCORDION_L5.openPanelShimmerRepeat,
                  ease: "easeInOut",
                }}
              />
            ) : null}
            <TravelTrustFaqAnswerBody answerKey={aKey} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.li>
  );
}

export function TravelTrustFaqStrip() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const titleId = TT_TRAVELTRUST_SECTION_A11Y.faq.title;
  const listId = TT_TRAVELTRUST_SECTION_A11Y.faq.list;
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [accordionEl, setAccordionEl] = useState<HTMLDivElement | null>(null);

  const focusTrigger = useCallback(
    (idx: number) => {
      if (!accordionEl) return;
      accordionEl.querySelector<HTMLButtonElement>(`[data-tt-traveltrust-faq-trigger="${idx}"]`)?.focus();
    },
    [accordionEl],
  );

  const toggleItem = useCallback((i: number) => {
    setOpenIdx((prev) => (prev === i ? null : i));
  }, []);

  const onTriggerKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
      const last = FAQ_ITEMS.length - 1;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        toggleItem(idx);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = idx < last ? idx + 1 : 0;
        setOpenIdx(next);
        queueMicrotask(() => focusTrigger(next));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = idx > 0 ? idx - 1 : last;
        setOpenIdx(prev);
        focusTrigger(prev);
      } else if (e.key === "Home") {
        e.preventDefault();
        setOpenIdx(0);
        focusTrigger(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setOpenIdx(last);
        focusTrigger(last);
      }
    },
    [focusTrigger, toggleItem],
  );

  return (
    <section
      id="faq"
      className={TT_SECTION_SURFACE_L5.faq}
      aria-labelledby={titleId}
      data-tt-traveltrust-faq-strip="1"
      data-tt-traveltrust-faq-strip-l5="1"
      {...traveltrustSectionL5DataAttrs("faq")}
    >
      <div className={TT_SECTION_SURFACE_L5.faqAtmosphere} aria-hidden data-tt-traveltrust-faq-atmosphere-l5="1" />
      <div className={TT_SECTION_SURFACE_L5.faqWarmScrimClass} aria-hidden data-tt-traveltrust-faq-warm-scrim-l5="1" />
      <motion.div
        className={TT_SECTION_CONTENT_L5.bodyClass}
        data-tt-traveltrust-trust-faq-liquidity-surface-l5="1"
      >
      <p className={TT_SECTION_KICKER_L5}>{t("traveltrust_faq_eyebrow")}</p>
      <h2 id={titleId} className={`${TT_SECTION_CONTENT_L5.kickerToHeadingClass} ${TT_SECTION_CONTENT_L5.headingClass}`}>
        {t("traveltrust_faq_title")}
      </h2>
      <p id={TT_TRAVELTRUST_SECTION_A11Y.faq.intro} className={TT_SECTION_CONTENT_L5.introClass}>
        <TravelTrustFaqIntro />
      </p>
      <div
        id={listId}
        ref={setAccordionEl}
        role="region"
        aria-labelledby={titleId}
        aria-describedby={TT_TRAVELTRUST_SECTION_A11Y.faq.intro}
        className={TT_SECTION_CONTENT_L5.stackAfterHeadingClass}
        data-tt-traveltrust-faq-accordion="1"
        data-tt-traveltrust-faq-open-index={openIdx === null ? "" : String(openIdx)}
      >
        <div className={TT_FAQ_ACCORDION_L5.warmPlateClass} data-tt-traveltrust-faq-warm-plate-l5="1">
        <ul className={TT_FAQ_ACCORDION_L5.listClass}>
          {FAQ_ITEMS.map((item, i) => (
            <FaqAccordionItem
              key={item.q}
              item={item}
              index={i}
              open={openIdx === i}
              reduceMotion={reduceMotion}
              onToggle={toggleItem}
              onTriggerKeyDown={onTriggerKeyDown}
            />
          ))}
        </ul>
        </div>
      </div>
      </motion.div>
    </section>
  );
}
