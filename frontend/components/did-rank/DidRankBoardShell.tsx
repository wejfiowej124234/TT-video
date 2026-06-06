"use client";

import { useRef, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { DidRankBoardTab, Period } from "@/lib/didRankUtils";
import { DidRankBoardRefreshBar } from "@/components/did-rank/DidRankBoardRefreshBar";
import DidRankSkeleton from "@/components/did-rank/DidRankSkeleton";
import {
  TT_MARKETING_DID_RANK_BOARD_SHELL,
  TT_MARKETING_DID_RANK_TAB_ACTIVE,
  TT_MARKETING_DID_RANK_TAB_IDLE,
  TT_MARKETING_DID_RANK_TABLIST,
} from "@/lib/uiSystem";
import { TT_MARKETING_DID_RANK_SURFACE } from "@/lib/marketingUi";

const BOARD_ORDER: DidRankBoardTab[] = [
  "traveler",
  "guide",
  "itinerary",
  "provider",
  "acquisition",
];

const BOARD_TAB_DEFS = [
  { id: "traveler" as const, labelKey: "didRank_travelerRankShort" },
  { id: "guide" as const, labelKey: "didRank_guideRankShort" },
  { id: "itinerary" as const, labelKey: "didRank_itineraryRankShort" },
  { id: "provider" as const, labelKey: "didRank_providerRankShort" },
  { id: "acquisition" as const, labelKey: "didRank_acquisitionRankShort" },
] as const;

function usePreviousDidRankBoard(value: DidRankBoardTab): DidRankBoardTab | undefined {
  const ref = useRef<DidRankBoardTab | undefined>(undefined);
  const prev = ref.current;
  ref.current = value;
  return prev;
}

function didRankFlipTransition(reduced: boolean) {
  return reduced
    ? { duration: 0.01, ease: "linear" as const }
    : { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const };
}

function didRankPageVariants(reduced: boolean) {
  if (reduced) {
    return {
      enter: { opacity: 0 },
      center: { opacity: 1 },
      exit: { opacity: 0 },
    };
  }
  return {
    enter: (dir: number) => ({
      x: dir * 48,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: -dir * 40,
      opacity: 0,
    }),
  };
}

export type DidRankBoardShellProps = {
  rankTabPanelId: string;
  rankTabIdPrefix: string;
  timeRange: Period;
  activeBoard: DidRankBoardTab;
  onSelectBoard: (tab: DidRankBoardTab) => void;
  /** Tab hover 预载副榜 API（provider / acquisition） */
  onWarmBoard?: (tab: DidRankBoardTab) => void;
  isLoading: boolean;
  isRefreshing: boolean;
  t: (key: string) => string;
  /** 当前 activeBoard 面板；仅挂载 active 节点 */
  activePanel: ReactNode;
};

/** Tab 侧栏 + 动画面板容器（30 §4 赛博壳）；供 `DidRankPageInner` 组合以降低 `page.tsx` 行数 */
export function DidRankBoardShell({
  rankTabPanelId,
  rankTabIdPrefix,
  timeRange,
  activeBoard,
  onSelectBoard,
  onWarmBoard,
  isLoading,
  isRefreshing,
  t,
  activePanel,
}: DidRankBoardShellProps) {
  const prevBoard = usePreviousDidRankBoard(activeBoard);
  const slideDir =
    prevBoard === undefined
      ? 1
      : BOARD_ORDER.indexOf(activeBoard) >= BOARD_ORDER.indexOf(prevBoard)
        ? 1
        : -1;
  const reduceMotion = useReducedMotion();
  const flipTransition = didRankFlipTransition(!!reduceMotion);
  const pageVariants = didRankPageVariants(!!reduceMotion);

  return (
    <div
      id={rankTabPanelId}
      role="presentation"
      aria-labelledby={`${rankTabIdPrefix}-${timeRange}`}
      className={TT_MARKETING_DID_RANK_BOARD_SHELL}
      aria-busy={isLoading || isRefreshing ? true : undefined}
    >
      <nav
        role="tablist"
        aria-label={t("didRank_boardNavAria")}
        className={TT_MARKETING_DID_RANK_TABLIST}
      >
        {BOARD_TAB_DEFS.map((b) => {
          const selected = activeBoard === b.id;
          return (
            <button
              key={b.id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`did-rank-board-panel-${b.id}`}
              id={`did-rank-board-tab-${b.id}`}
              onClick={() => onSelectBoard(b.id)}
              onPointerEnter={() => {
                if (!selected) onWarmBoard?.(b.id);
              }}
              onFocus={() => {
                if (!selected) onWarmBoard?.(b.id);
              }}
              className={selected ? TT_MARKETING_DID_RANK_TAB_ACTIVE : TT_MARKETING_DID_RANK_TAB_IDLE}
            >
              {t(b.labelKey)}
            </button>
          );
        })}
      </nav>

      <div className="flex-1 min-w-0 lg:pl-2 flex flex-col">
        <div className={TT_MARKETING_DID_RANK_SURFACE.boardInner}>
          <DidRankBoardRefreshBar active={isRefreshing} label={t("didRank_refreshing")} />
          {isLoading && !isRefreshing ? (
            <div className="p-1 sm:p-2">
              <DidRankSkeleton t={t} />
            </div>
          ) : (
            <AnimatePresence mode="wait" custom={slideDir}>
              <motion.div
                key={activeBoard}
                role="tabpanel"
                id={`did-rank-board-panel-${activeBoard}`}
                aria-labelledby={`did-rank-board-tab-${activeBoard}`}
                custom={slideDir}
                variants={pageVariants}
                /** `initial="enter"` 首帧 `opacity:0`；Playwright `toBeVisible` 与 SR 在 `AnimatePresence mode="wait"` 下会误判超时 */
                initial={false}
                animate="center"
                exit="exit"
                transition={flipTransition}
                className="w-full overflow-x-hidden p-1 sm:p-2"
                style={reduceMotion ? undefined : { willChange: "opacity, transform" }}
              >
                {activePanel}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
