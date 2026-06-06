"use client";

import { useId, useState } from "react";
import { PERIOD_VALUES, type Period } from "@/lib/didRankUtils";
import {
  TT_MARKETING_DID_RANK_PERIOD_TAB_ACTIVE,
  TT_MARKETING_DID_RANK_PERIOD_TAB_IDLE,
  TT_MARKETING_DID_RANK_PATH,
  TT_MARKETING_DID_RANK_SURFACE,
} from "@/lib/marketingUi";

type TFunc = (key: string) => string;

function DidRankMeHint({ t }: { t: TFunc }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      <form
        className="inline"
        onSubmit={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
      >
        <button
          type="submit"
          className="text-meta text-slate-400 hover:text-slate-300 motion-sub flex items-center gap-1"
          aria-expanded={open}
        >
          <span className={open ? "rotate-90" : ""} aria-hidden>
            ▶
          </span>
          {t("didRank_shareMyRank")}
        </button>
      </form>
      {open && <p className="text-meta text-slate-400 mt-1 pl-4">{t("didRank_meHint")}</p>}
    </div>
  );
}

export interface DidRankHeaderSkeletonProps {
  t: TFunc;
  timeRange: Period;
  setTimeRange: (range: Period) => void;
  showMeHint: boolean;
  rankTabPanelId: string;
  rankTabIdPrefix: string;
}

/**
 * 与 `DidRankHeader` 同壳；标题区脉冲槽 + 周期 Tab **可操作**（与下方 `tabpanel` id 对齐，免 a11y 断链）。
 * 副标题 / 链上状态 pill 仍用骨架，待数据就绪后由真 `DidRankHeader` 替换。
 */
export default function DidRankHeaderSkeleton({
  t,
  timeRange,
  setTimeRange,
  showMeHint,
  rankTabPanelId,
  rankTabIdPrefix,
}: DidRankHeaderSkeletonProps) {
  const h1Id = useId();
  const periodLabelId = useId();
  return (
    <header
      className={TT_MARKETING_DID_RANK_SURFACE.headerShell}
      aria-labelledby={h1Id}
      aria-busy="true"
    >
      <div className="flex-1 min-w-0">
        <h1 id={h1Id} className="sr-only">
          {t("didRank_title")}
        </h1>
        <div
          className="h-9 sm:h-10 w-64 max-w-full rounded-[var(--radius-sm)] bg-gradient-to-r from-ref-sun/30 via-ref-coral/25 to-ref-sun/20 animate-pulse"
          aria-hidden
        />
        <div className={`h-4 w-full max-w-lg mt-2 rounded ${TT_MARKETING_DID_RANK_SURFACE.skeletonPulseSoft}`} aria-hidden />
        <div
          className="inline-flex mt-2 min-h-[1.75rem] w-40 rounded-full border border-ref-sun/28 bg-ref-sun/10 animate-pulse"
          aria-hidden
        />
        <p className="text-meta text-slate-300 mt-3 mb-1" id={periodLabelId}>
          {t("didRank_periodLabel")}
        </p>
        <div role="tablist" aria-labelledby={periodLabelId} className="flex gap-2 flex-wrap">
          {PERIOD_VALUES.map((range) => (
            <button
              key={range}
              type="button"
              role="tab"
              aria-selected={timeRange === range}
              aria-controls={rankTabPanelId}
              id={`${rankTabIdPrefix}-${range}`}
              onClick={() => setTimeRange(range)}
              className={timeRange === range ? TT_MARKETING_DID_RANK_PERIOD_TAB_ACTIVE : TT_MARKETING_DID_RANK_PERIOD_TAB_IDLE}
            >
              {t(`didRank_${range}`)}
            </button>
          ))}
        </div>
        {showMeHint && <DidRankMeHint t={t} />}
        <div className="flex flex-wrap gap-2 mt-3" aria-hidden>
          <div className="h-6 w-24 rounded-full border border-ref-sun/35 bg-ref-sun/10 animate-pulse" />
          <div className={`h-6 w-28 rounded-full animate-pulse ${TT_MARKETING_DID_RANK_PATH.skeletonBadgeShimmer}`} />
        </div>
      </div>
    </header>
  );
}
