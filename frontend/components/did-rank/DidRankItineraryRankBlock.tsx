"use client";

import ItineraryRankBlock from "@/components/did-rank/ItineraryRankBlock";
import DidRankFetchErrorBanner from "@/components/did-rank/DidRankFetchErrorBanner";
import type { useDidRankItineraryBoard } from "@/components/did-rank/useDidRankItineraryBoard";
import type { Period } from "@/lib/didRankUtils";

type TFunc = (key: string) => string;
type ItineraryBoardState = ReturnType<typeof useDidRankItineraryBoard>;

/** 行程榜 · 加载/错误/轮询披露（① L5）；榜体仍由 `ItineraryRankBlock` 渲染 */
export default function DidRankItineraryRankBlock({
  period,
  t,
  livePollLifted = false,
  boardData,
  highlightItineraryId = null,
}: {
  period: Period;
  t: TFunc;
  livePollLifted?: boolean;
  boardData: ItineraryBoardState;
  highlightItineraryId?: string | null;
}) {
  const board = boardData;

  return (
    <div aria-busy={board.isLoading}>
      {board.isLoading ? (
        <p className="text-meta text-slate-400 mb-3" role="status">
          {t("didRank_secondaryBoardLoading")}
        </p>
      ) : null}
      {board.apiConnected ? (
        <p className="text-meta text-emerald-200/85 mb-3" role="status">
          {t("didRank_secondaryBoardApiConnected")}
        </p>
      ) : null}
      {!livePollLifted && board.livePollActive ? (
        <p className="text-meta text-slate-500 mb-3" role="status">
          {t("didRank_livePollActive")}
        </p>
      ) : null}
      {board.note ? <p className="text-meta text-slate-400 mb-3 max-w-xl">{board.note}</p> : null}
      {board.fetchError ? (
        <DidRankFetchErrorBanner
          fetchError="failed"
          onRetry={() => void board.refresh()}
          t={t}
          className="mb-3"
        />
      ) : null}
      {!board.fetchError ? (
        <ItineraryRankBlock
          listItineraries={board.isLoading ? [] : board.items}
          period={period}
          t={t}
          highlightItineraryId={highlightItineraryId}
        />
      ) : null}
    </div>
  );
}
