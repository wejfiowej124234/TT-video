"use client";

import { STEWARD_B_TRACK_ADMISSION_ANCHOR } from "@/lib/steward/stewardBTrackModel";
import { STEWARD_WORKBENCH_STAKE_ANCHOR } from "@/lib/me/meIdentitiesCoreCardModel";

export type StewardWorkbenchBTrackCompleteStripProps = {
  t: (key: string, vars?: Record<string, string | number>) => string;
  /** B 轨链上已质押时改用完成态文案，不再显示「前往质押」 */
  bTrackStaked?: boolean;
};

/** B 轨已完成 · 单行薄条（进度条已展示 B1/B2 完成态 · 准入费 REMOVE · G088） */
export default function StewardWorkbenchBTrackCompleteStrip({
  t,
  bTrackStaked = false,
}: StewardWorkbenchBTrackCompleteStripProps) {
  return (
    <div
      id={STEWARD_B_TRACK_ADMISSION_ANCHOR}
      className="mb-1 scroll-mt-24 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-4 py-2.5"
      data-tt-steward-workbench-b-track-complete-strip="1"
      data-tt-steward-workbench-b-track-complete-strip-staked={bTrackStaked ? "1" : "0"}
      data-tt-steward-workbench-b-track-fee-removed="1"
      role="status"
    >
      <p className="text-meta leading-relaxed text-emerald-100/95">
        {t("steward_workbench_b_track_complete_strip_inline")}{" "}
        {bTrackStaked ? (
          <>
            {t("steward_workbench_b_track_complete_strip_b_staked")}{" "}
            <a
              href={`#${STEWARD_WORKBENCH_STAKE_ANCHOR}`}
              className="font-medium text-emerald-200 underline decoration-emerald-500/40 underline-offset-2 hover:text-emerald-100"
              data-tt-steward-workbench-b-track-complete-strip-view-cta="1"
            >
              {t("steward_workbench_b_track_complete_strip_view_cta")}
            </a>
          </>
        ) : (
          <a
            href={`#${STEWARD_WORKBENCH_STAKE_ANCHOR}`}
            className="font-medium text-emerald-200 underline decoration-emerald-500/40 underline-offset-2 hover:text-emerald-100"
            data-tt-steward-workbench-b-track-complete-strip-cta="1"
          >
            {t("steward_workbench_b_track_complete_strip_cta")}
          </a>
        )}
      </p>
    </div>
  );
}
