"use client";

import {
  GUIDE_WORKBENCH_PAGE_L5_CLOSURE_PROBE,
  GUIDE_WORKBENCH_PAGE_L5_FROZEN_MARKER,
} from "@/lib/guide/guideWorkbenchL5ClosureSprintModel";
import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";

export type GuideWorkbenchStatsTeaserProps = {
  t: (key: string, vars?: Record<string, string | number>) => string;
};

/** 新向导折叠统计区时的「首单后展开」锚点（① · L5） */
export default function GuideWorkbenchStatsTeaser({ t }: GuideWorkbenchStatsTeaserProps) {
  return (
    <section
      id="guide-workbench-stats"
      className={`${TT_WORKSPACE_L5.sectionCard} mb-1 border border-dashed border-ref-sun/20 bg-ref-sun/[0.03]`}
      aria-label={t("guide_workbench_stats_teaser_aria")}
      data-tt-guide-workbench-stats-teaser="1"
      data-tt-guide-workbench-l5-closure={GUIDE_WORKBENCH_PAGE_L5_CLOSURE_PROBE}
      data-tt-ui-frozen={GUIDE_WORKBENCH_PAGE_L5_FROZEN_MARKER}
    >
      <h2 className="text-small font-semibold text-slate-300">{t("guide_workbench_stats_teaser_title")}</h2>
      <p className="text-meta text-slate-400 mt-1">{t("guide_workbench_stats_teaser_body")}</p>
    </section>
  );
}
