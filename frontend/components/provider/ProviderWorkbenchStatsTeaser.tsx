"use client";

import {
  PROVIDER_WORKBENCH_PAGE_L5_CLOSURE_PROBE,
  PROVIDER_WORKBENCH_PAGE_L5_FROZEN_MARKER,
} from "@/lib/provider/providerWorkbenchL5ClosureSprintModel";
import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";

export type ProviderWorkbenchStatsTeaserProps = {
  t: (key: string, vars?: Record<string, string | number>) => string;
};

/** 新商家折叠统计区时的「首单后展开」锚点（① · L5） */
export default function ProviderWorkbenchStatsTeaser({ t }: ProviderWorkbenchStatsTeaserProps) {
  return (
    <section
      id="provider-workbench-stats"
      className={`${TT_WORKSPACE_L5.sectionCard} mb-1 border border-dashed border-ref-sun/20 bg-ref-sun/[0.03]`}
      aria-label={t("provider_workbench_stats_teaser_aria")}
      data-tt-provider-workbench-stats-teaser="1"
      data-tt-provider-workbench-l5-closure={PROVIDER_WORKBENCH_PAGE_L5_CLOSURE_PROBE}
      data-tt-ui-frozen={PROVIDER_WORKBENCH_PAGE_L5_FROZEN_MARKER}
    >
      <h2 className="text-small font-semibold text-slate-300">{t("provider_workbench_stats_teaser_title")}</h2>
      <p className="text-meta text-slate-400 mt-1">{t("provider_workbench_stats_teaser_body")}</p>
    </section>
  );
}
