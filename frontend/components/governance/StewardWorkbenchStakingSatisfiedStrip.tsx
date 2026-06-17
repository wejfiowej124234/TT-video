"use client";

import Link from "next/link";
import { FOCUS_RING } from "@/components/me/constants";
import { STEWARD_WORKBENCH_STAKE_ANCHOR } from "@/lib/me/meIdentitiesCoreCardModel";
import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";

export type StewardWorkbenchStakingSatisfiedStripProps = {
  t: (key: string, vars?: Record<string, string | number>) => string;
  offchainLabelKey: string;
  chainSummaryKey: string;
};

/** 任内 · 链上已质押薄条（对齐向导 satisfied 薄条） */
export default function StewardWorkbenchStakingSatisfiedStrip({
  t,
  offchainLabelKey,
  chainSummaryKey,
}: StewardWorkbenchStakingSatisfiedStripProps) {
  return (
    <div
      className="mb-4 rounded-xl border border-ref-sun/20 bg-ref-sun/[0.06] px-4 py-3"
      data-tt-steward-workbench-staking-status="satisfied"
    >
      <p className="text-meta text-slate-300">
        {t("steward_workbench_staking_satisfied_summary", {
          offchain: t(offchainLabelKey),
          chain: t(chainSummaryKey),
        })}
      </p>
      <p className="mt-1.5 text-meta text-emerald-200/90">{t("steward_workbench_staking_satisfied_dual_track")}</p>
      <p className="mt-2">
        <Link
          href={`#${STEWARD_WORKBENCH_STAKE_ANCHOR}`}
          className={`${TT_WORKSPACE_L5.navLink} ${FOCUS_RING}`}
          data-tt-steward-workbench-staking-manage-cta="1"
        >
          {t("steward_workbench_staking_view_section_cta")}
        </Link>
      </p>
    </div>
  );
}
