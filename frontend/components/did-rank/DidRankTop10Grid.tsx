"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import {
  DID_RANK_TOP10_ROW_TAIL_WRAP,
  didRankTop10RowGridClass,
  splitDidRankTop10,
  splitDidRankTop10RowBand,
} from "@/lib/didRankTop10Layout";
import { didRankTop3GlowLayerClass } from "@/lib/didRankTop3Glow";
import type { DidRankTop10CardVariant } from "@/lib/refTopTenCardTier";
import {
  didRankPodiumColumnClass,
  didRankPodiumGlowClass,
  didRankPodiumPedestalClass,
  didRankPodiumStageWrapClass,
} from "@/lib/didRankPodiumStage";
import { TT_MARKETING_DID_RANK_SURFACE } from "@/lib/marketingUi";

const layoutEase = [0.22, 1, 0.36, 1] as const;

export function DidRankTop10Grid<T extends { id: string; rank: number }>({
  items,
  gridId,
  renderCard,
  className = "",
  layoutGroupId = "did-rank-top10",
  staggerKey = "default",
  refreshFlashKey = 0,
  stageTintClass = "from-ref-sun/[0.07]",
  podiumLabel,
  rowBandLabel,
}: {
  items: T[];
  gridId?: string;
  renderCard: (item: T, variant: DidRankTop10CardVariant) => ReactNode;
  className?: string;
  layoutGroupId?: string;
  /** period 或刷新结束 pulse，触发 Top10 错峰重播 */
  staggerKey?: string;
  refreshFlashKey?: number;
  /** 列主题渐变前缀，如 `from-fuchsia-500/[0.07]` */
  stageTintClass?: string;
  podiumLabel?: string;
  rowBandLabel?: string;
}) {
  const reduceMotion = useReducedMotion();
  const staggeredForRef = useRef<string | null>(null);
  const { top10, row, podiumVisual } = splitDidRankTop10(items);
  const { head: rowHead, tail: rowTail } = splitDidRankTop10RowBand(row);
  if (top10.length === 0) return null;

  const s = TT_MARKETING_DID_RANK_SURFACE;
  const stageShell = `${s.top10StageShell} bg-gradient-to-b ${stageTintClass}`;
  const enterKey = `${staggerKey}:${refreshFlashKey}`;

  let delayIndex = 0;
  const stagger = reduceMotion ? 0 : 0.06;
  const shouldStaggerEnter = staggeredForRef.current !== enterKey;
  if (shouldStaggerEnter) staggeredForRef.current = enterKey;
  const refreshFlashClass =
    refreshFlashKey > 0 ? s.top10RefreshFlash : "";

  const enterMotion = (delay: number) =>
    reduceMotion || !shouldStaggerEnter
      ? { initial: false as const, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.28, ease: layoutEase, delay },
        };

  return (
    <LayoutGroup id={layoutGroupId}>
      <div id={gridId} key={refreshFlashKey} className={`${stageShell} ${refreshFlashClass} ${className}`}>
        {podiumVisual.length > 0 ? (
          <div>
            {podiumLabel ? (
              <p className={`${s.top10BandLabel} !mb-3 !normal-case !tracking-[0.2em] text-ref-sun/70`}>
                {podiumLabel}
              </p>
            ) : null}
            <div
              className="flex flex-wrap justify-center items-end gap-2 sm:gap-3 max-w-4xl mx-auto"
              role="list"
              aria-label="top-3"
            >
              {podiumVisual.map((item) => {
                const delay = delayIndex++ * stagger;
                const enter = enterMotion(delay);
                const glowLayer = didRankTop3GlowLayerClass(item.rank);
                return (
                  <motion.div
                    key={item.id}
                    role="listitem"
                    aria-posinset={item.rank}
                    className={`min-w-[5.25rem] max-w-[8rem] sm:min-w-[6.75rem] ${didRankPodiumColumnClass(item.rank)}`}
                    {...enter}
                  >
                    <div className={didRankPodiumStageWrapClass(item.rank)}>
                      <span className={didRankPodiumGlowClass(item.rank)} aria-hidden />
                      {glowLayer ? <span className={glowLayer} aria-hidden /> : null}
                      <div className={s.rankCardTextCrisp}>{renderCard(item, "podium")}</div>
                      <span className={didRankPodiumPedestalClass(item.rank)} aria-hidden />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : null}
        {row.length > 0 ? (
          <div className={s.top10RowBand}>
            {rowBandLabel ? <p className={s.top10BandLabel}>{rowBandLabel}</p> : null}
            <div className={didRankTop10RowGridClass(rowHead.length)} role="list" aria-label="top-4-10">
              {rowHead.map((item) => {
                const delay = delayIndex++ * stagger;
                const enter = enterMotion(delay);
                return (
                  <motion.div
                    key={item.id}
                    role="listitem"
                    aria-posinset={item.rank}
                    className="min-w-0 h-full"
                    {...enter}
                  >
                    <div className={s.rankCardTextCrisp}>{renderCard(item, "row")}</div>
                  </motion.div>
                );
              })}
            </div>
            {rowTail.length > 0 ? (
              <div className={DID_RANK_TOP10_ROW_TAIL_WRAP} role="list" aria-label="top-8-10">
                {rowTail.map((item) => {
                  const delay = delayIndex++ * stagger;
                  const enter = enterMotion(delay);
                  return (
                    <motion.div
                      key={item.id}
                      role="listitem"
                      aria-posinset={item.rank}
                      className="min-w-[5.5rem] max-w-[8.5rem] sm:min-w-[6.25rem] sm:max-w-[9rem] h-full"
                      {...enter}
                    >
                      <div className={s.rankCardTextCrisp}>{renderCard(item, "row")}</div>
                    </motion.div>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </LayoutGroup>
  );
}
