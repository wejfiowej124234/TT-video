"use client";

import { useId, useState } from "react";
import { PERIOD_VALUES } from "@/lib/didRankUtils";
import type { Period } from "@/lib/didRankUtils";
import {
  TT_MARKETING_DID_RANK_PERIOD_TAB_ACTIVE,
  TT_MARKETING_DID_RANK_PERIOD_TAB_IDLE,
  TT_MARKETING_DID_RANK_PAGE_H1,
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
  /** ① 本地：已注入 `didRankDevPreview` 示意榜 */
  devPreviewActive?: boolean;
  livePollActive?: boolean;
  /** 与页内 `role="tabpanel"` 的 id 一致；由页面 `useId()` 生成，避免多实例冲突 */
  rankTabPanelId: string;
  /** 各周期 Tab 的 id 前缀；完整 id 为 `${rankTabIdPrefix}-${range}` */
  rankTabIdPrefix: string;
  /** hover 预载其它周期主榜 API */
  onWarmPeriod?: (range: Period) => void;
}

/** 30 §4：标题、副标题、时间范围 Tab、如何分享我的排名、链/币 pill */
export default function DidRankHeader({
  t,
  timeRange,
  setTimeRange,
  showMeHint,
  apiDataConnected = false,
  devPreviewActive = false,
  livePollActive = false,
  rankTabPanelId,
  rankTabIdPrefix,
  onWarmPeriod,
}: DidRankHeaderProps) {
  const periodLabelId = useId();
  return (
    <header
      className={TT_MARKETING_DID_RANK_SURFACE.headerShell}
    >
      <div className="flex-1 min-w-0">
        <h1 className={TT_MARKETING_DID_RANK_PAGE_H1}>{t("didRank_title")}</h1>
        <p className="text-small text-slate-300 mt-1">{t("didRank_subtitle")}</p>
        <div className="mt-1.5 flex flex-col gap-1.5 items-start">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-meta ${
              apiDataConnected
                ? "border-ref-sun/40 bg-ref-sun/10 text-ref-sun"
                : "border-ref-coral/35 bg-ref-coral/10 text-ref-coral"
            }`}
            role="status"
          >
            {apiDataConnected ? t("didRank_apiLiveActivitySort") : t("didRank_dataNote")}
          </span>
          {devPreviewActive ? (
            <span
              className="inline-flex max-w-xl items-center rounded-[var(--radius-sm)] border border-ref-sun/28 bg-ink-900/55 px-2.5 py-1 text-meta text-slate-200/95"
              role="status"
              data-tt-did-rank-dev-preview="1"
            >
              {t("didRank_devPreviewBanner")}
            </span>
          ) : null}
          {livePollActive ? (
            <span
              className="inline-flex items-center rounded-[var(--radius-sm)] border border-cyan-500/28 bg-cyan-500/10 px-2.5 py-1 text-meta text-cyan-200/95"
              role="status"
            >
              {t("didRank_livePollActive")}
            </span>
          ) : null}
        </div>
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
              onPointerEnter={() => {
                if (timeRange !== range) onWarmPeriod?.(range);
              }}
              className={timeRange === range ? TT_MARKETING_DID_RANK_PERIOD_TAB_ACTIVE : TT_MARKETING_DID_RANK_PERIOD_TAB_IDLE}
            >
              {t(`didRank_${range}`)}
            </button>
          ))}
        </div>
        {showMeHint && <DidRankMeHint t={t} />}
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="rounded-full border border-ref-sun/35 bg-ref-sun/10 px-3 py-0.5 text-meta text-ref-sun">{t("didRank_badge_polygon")}</span>
          <span className={TT_MARKETING_DID_RANK_PATH.badgeSecondary}>{t("didRank_badge_stablecoins")}</span>
        </div>
      </div>
    </header>
  );
}
