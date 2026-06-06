"use client";

import { useCallback, useMemo } from "react";
import type { Period } from "@/lib/didRankUtils";
import { DidRankCopyRankLink } from "@/components/did-rank/DidRankCopyRankLink";
import { buildDidRankSharePath } from "@/lib/didRankShareLink";

type TFunc = (key: string) => string;

/** 副榜：回到我的排名 + 复制深链（`?me=provider-|acquisition-<uuid>`） */
export function DidRankSecondaryBoardHeaderActions({
  board,
  period,
  highlightUserId,
  t,
}: {
  board: "provider" | "acquisition";
  period: Period;
  highlightUserId: string | null;
  t: TFunc;
}) {
  const shareRankPath = useMemo(
    () => (highlightUserId ? buildDidRankSharePath(board, highlightUserId, period) : null),
    [board, highlightUserId, period],
  );

  const scrollToMyRank = useCallback(() => {
    if (!highlightUserId) return;
    document
      .getElementById(`did-rank-secondary-row-${board}-${highlightUserId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [board, highlightUserId]);

  if (!highlightUserId) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 shrink-0">
      <form
        className="inline"
        onSubmit={(e) => {
          e.preventDefault();
          scrollToMyRank();
        }}
      >
        <button
          type="submit"
          className="rounded-[var(--radius-sm)] border border-ref-sun/35 bg-ref-sun/12 px-2 py-1 text-meta text-ref-sun/90 hover:text-ref-sun hover:bg-ref-sun/20 motion-sub"
        >
          {t("didRank_goToMyRank")}
        </button>
      </form>
      {shareRankPath ? <DidRankCopyRankLink sharePath={shareRankPath} board={board} t={t} /> : null}
    </div>
  );
}
