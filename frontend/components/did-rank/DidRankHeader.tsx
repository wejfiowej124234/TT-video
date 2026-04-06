"use client";

import { useId, useState } from "react";
import { PERIOD_VALUES } from "@/lib/didRankUtils";
import type { Period } from "@/lib/didRankUtils";

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
          <span className={open ? "rotate-90" : ""} aria-hidden>▶</span>
          {t("didRank_shareMyRank")}
        </button>
      </form>
      {open && <p className="text-meta text-slate-400 mt-1 pl-4">{t("didRank_meHint")}</p>}
    </div>
  );
}

export interface DidRankHeaderProps {
  t: TFunc;
  timeRange: Period;
  setTimeRange: (range: Period) => void;
  showMeHint: boolean;
  /** 三条 did-rank API 均 200 且解析成功时为 true，用于区分「实时 API」与降级/占位文案 */
  apiDataConnected?: boolean;
  /** 与页内 `role="tabpanel"` 的 id 一致；由页面 `useId()` 生成，避免多实例冲突 */
  rankTabPanelId: string;
  /** 各周期 Tab 的 id 前缀；完整 id 为 `${rankTabIdPrefix}-${range}` */
  rankTabIdPrefix: string;
}

/** 30 §4：标题、副标题、时间范围 Tab、如何分享我的排名、链/币 pill */
export default function DidRankHeader({
  t,
  timeRange,
  setTimeRange,
  showMeHint,
  apiDataConnected = false,
  rankTabPanelId,
  rankTabIdPrefix,
}: DidRankHeaderProps) {
  const periodLabelId = useId();
  return (
    <header
      className="rounded-[var(--radius-lg)] border border-cyan-400/35 bg-slate-900/55 backdrop-blur-md px-4 py-4 sm:px-6 sm:py-5 mb-6 sm:mb-8 shadow-[0_0_40px_-12px_rgba(35,206,217,0.12),0_0_48px_-16px_rgba(252,164,124,0.06)] ring-1 ring-white/5 motion-sub hover:border-cyan-400/55 hover:shadow-scifi-hover-strong flex flex-col lg:flex-row lg:items-center lg:gap-8"
    >
      <div className="flex-1 min-w-0">
        <h1 className="text-h2 font-bold bg-gradient-to-r from-ref-cyan via-fuchsia-400 to-ref-coral bg-clip-text text-transparent">
          {t("didRank_title")}
        </h1>
        <p className="text-small text-slate-300 mt-1">{t("didRank_subtitle")}</p>
        <span
          className={`inline-flex items-center mt-1.5 rounded-full border px-2.5 py-0.5 text-meta ${
            apiDataConnected
              ? "border-cyan-500/45 bg-cyan-500/10 text-cyan-200"
              : "border-amber-500/40 bg-amber-500/10 text-amber-300"
          }`}
          role="status"
        >
          {apiDataConnected ? t("didRank_apiLiveActivitySort") : t("didRank_dataNote")}
        </span>
        <p className="text-meta text-slate-300 mt-3 mb-1" id={periodLabelId}>{t("didRank_periodLabel")}</p>
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
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="rounded-full border border-cyan-400/50 bg-cyan-400/10 px-3 py-0.5 text-meta text-cyan-300">{t("didRank_badge_polygon")}</span>
          <span className="rounded-full border border-fuchsia-400/50 bg-fuchsia-400/10 px-3 py-0.5 text-meta text-fuchsia-300">{t("didRank_badge_stablecoins")}</span>
        </div>
      </div>
    </header>
  );
}
