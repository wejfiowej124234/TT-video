"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { DidRankFullRankList } from "@/components/did-rank/DidRankFullRankList";
import { TT_MARKETING_DID_RANK_SURFACE } from "@/lib/marketingUi";

type TFunc = (key: string, vars?: Record<string, string | number>) => string;

/** 11～100：L5 披露式展开（非下拉条） */
export function DidRankFullListFold({
  restCount,
  endRank,
  expanded,
  onToggle,
  ariaLabel,
  header,
  children,
  footer,
  listPanelRingClass = TT_MARKETING_DID_RANK_SURFACE.listPanelRingTraveler,
  restEmptyI18nKey = "didRank_noRank11_100",
  foldHintI18nKey = "didRank_fullListFoldHint",
  t,
}: {
  restCount: number;
  endRank: number;
  expanded: boolean;
  onToggle: () => void;
  ariaLabel: string;
  header: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  listPanelRingClass?: string;
  restEmptyI18nKey?: string;
  foldHintI18nKey?: string;
  t: TFunc;
}) {
  const reduceMotion = useReducedMotion();
  const s = TT_MARKETING_DID_RANK_SURFACE;

  if (restCount <= 0) {
    return <p className={s.emptyPanelCompact}>{t(restEmptyI18nKey)}</p>;
  }

  return (
    <div className={s.fullListFoldWrap}>
      <div className={s.fullListFoldDivider}>
        <div className={s.fullListFoldRule} aria-hidden />
        <form
          className="shrink-0"
          onSubmit={(e) => {
            e.preventDefault();
            onToggle();
          }}
        >
          <button
            type="submit"
            aria-expanded={expanded}
            className={`${s.fullListFoldDisclosure} ${expanded ? s.fullListFoldDisclosureExpanded : ""}`}
          >
            <span>
              {expanded
                ? t("didRank_fullListFoldCtaCollapse", { endRank })
                : t("didRank_fullListFoldCtaExpand", { count: restCount, endRank })}
            </span>
            <span className={`${s.fullListFoldChevron} ${expanded ? "rotate-180" : ""}`} aria-hidden>
              ▾
            </span>
          </button>
        </form>
        <div className={s.fullListFoldRule} aria-hidden />
      </div>
      {!expanded ? <p className={s.fullListFoldHint}>{t(foldHintI18nKey)}</p> : null}
      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="rest"
            className="overflow-hidden mt-4 [content-visibility:auto]"
            initial={reduceMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
            transition={reduceMotion ? { duration: 0.01 } : { duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <DidRankFullRankList
              ariaLabel={ariaLabel}
              header={header}
              footer={footer}
              listPanelRingClass={listPanelRingClass}
            >
              {children}
            </DidRankFullRankList>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
