"use client";

import { useId, useState } from "react";
import { PERIOD_VALUES, type Period } from "@/lib/didRankUtils";

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
      className="rounded-[var(--radius-lg)] border border-cyan-400/35 bg-slate-900/55 backdrop-blur-md px-4 py-4 sm:px-6 sm:py-5 mb-6 sm:mb-8 shadow-[0_0_40px_-12px_rgba(35,206,217,0.12),0_0_48px_-16px_rgba(252,164,124,0.06)] ring-1 ring-white/5 motion-sub hover:border-cyan-400/55 hover:shadow-scifi-hover-strong flex flex-col lg:flex-row lg:items-center lg:gap-8"
      aria-labelledby={h1Id}
      aria-busy="true"
    >
      <div className="flex-1 min-w-0">
        <h1 id={h1Id} className="sr-only">
          {t("didRank_title")}
        </h1>
        <div
          className="h-9 sm:h-10 w-64 max-w-full rounded-[var(--radius-sm)] bg-gradient-to-r from-cyan-500/30 via-fuchsia-400/25 to-ref-coral/25 animate-pulse"
          aria-hidden
        />
        <div className="h-4 w-full max-w-lg mt-2 rounded bg-slate-600/40 animate-pulse" aria-hidden />
        <div
          className="inline-flex mt-2 min-h-[1.75rem] w-40 rounded-full border border-amber-500/35 bg-amber-500/10 animate-pulse"
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
              className={`rounded-full border px-3 py-1 text-meta font-medium motion-sub ${
                timeRange === range
                  ? "border-transparent bg-gradient-to-r from-fuchsia-600/85 to-ref-coral/75 text-white shadow-[0_0_20px_-4px_rgba(252,164,124,0.35)]"
                  : "border-slate-600/80 bg-slate-800/70 text-slate-300 hover:border-ref-cyan/35 hover:text-slate-200"
              }`}
            >
              {t(`didRank_${range}`)}
            </button>
          ))}
        </div>
        {showMeHint && <DidRankMeHint t={t} />}
        <div className="flex flex-wrap gap-2 mt-3" aria-hidden>
          <div className="h-6 w-24 rounded-full border border-cyan-400/40 bg-cyan-400/10 animate-pulse" />
          <div className="h-6 w-28 rounded-full border border-fuchsia-400/40 bg-fuchsia-400/10 animate-pulse" />
        </div>
      </div>
    </header>
  );
}
