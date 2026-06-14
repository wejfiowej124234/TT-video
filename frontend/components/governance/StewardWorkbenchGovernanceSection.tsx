"use client";

import Link from "next/link";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { FOCUS_RING } from "@/components/me/constants";
import type { PoolRes, RewardsRes } from "@/app/governance/governanceHubPageModel";
import {
  stewardGovernanceCompactTrackLines,
  stewardGovernanceDataSourceNoteKey,
  stewardPoolStatDisplay,
  stewardRewardsItemCount,
} from "@/lib/governance/stewardWorkbenchGovernanceModel";
import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";

export type StewardWorkbenchGovernanceSectionProps = {
  t: (key: string, vars?: Record<string, string | number>) => string;
  pool: PoolRes | null;
  rewards: RewardsRes | null;
  poolHttpError: string | null;
  rewardsHttpError: string | null;
};

/** 主理人工作台 · 区域治理观测（L5 扁平：统计 + 分轨摘要 + Hub 入口） */
export default function StewardWorkbenchGovernanceSection({
  t,
  pool,
  rewards,
  poolHttpError,
  rewardsHttpError,
}: StewardWorkbenchGovernanceSectionProps) {
  const poolStat = stewardPoolStatDisplay(pool);
  const rewardsCount = stewardRewardsItemCount(rewards);
  const trackLines = stewardGovernanceCompactTrackLines(pool, 3);
  const dataNoteKey = stewardGovernanceDataSourceNoteKey(pool, rewards);
  const poolLine =
    poolStat.currency && poolStat.value !== "—"
      ? `${poolStat.value} ${poolStat.currency}`
      : poolStat.value;

  return (
    <section
      className={TT_WORKSPACE_L5.sectionCard}
      aria-label={t("steward_workbench_governance_combined_aria")}
      data-tt-steward-governance-combined="1"
    >
      <h2 className={TT_WORKSPACE_L5.sectionTitle}>{t("steward_workbench_governance_combined_title")}</h2>
      <p className={TT_WORKSPACE_L5.sectionSubtitle}>{t("steward_workbench_governance_combined_subtitle")}</p>

      {poolHttpError ? (
        <div className="mt-3">
          <ApiErrorAlert message={poolHttpError} />
        </div>
      ) : null}
      {rewardsHttpError ? (
        <div className="mt-3">
          <ApiErrorAlert message={rewardsHttpError} />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3 mt-3">
        <div className={TT_WORKSPACE_L5.statTile}>
          <p className={TT_WORKSPACE_L5.statValue}>{poolLine}</p>
          <p className={TT_WORKSPACE_L5.statLabel}>{t("steward_workbench_stats_pool_balance")}</p>
          {poolStat.isChainSsot ? (
            <p className="text-meta text-ref-sun/80 mt-1">{t("governance_chain_read_ssot_badge")}</p>
          ) : null}
        </div>
        <div className={TT_WORKSPACE_L5.statTile}>
          <p className={TT_WORKSPACE_L5.statValueAccent}>{rewardsCount}</p>
          <p className={TT_WORKSPACE_L5.statLabel}>{t("steward_workbench_stats_rewards_count")}</p>
          <p className="mt-2">
            <Link
              href="/governance/distribution-claim"
              className={`${TT_WORKSPACE_L5.navLink} ${FOCUS_RING}`}
              data-tt-steward-governance-claim-cta="1"
            >
              {t("steward_workbench_governance_claim_cta")}
            </Link>
          </p>
        </div>
      </div>

      {trackLines.length > 0 ? (
        <ul className="mt-3 space-y-1.5" data-tt-steward-governance-tracks="1">
          {trackLines.map((line) => (
            <li
              key={line.label}
              className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 rounded-lg border border-ref-sun/12 bg-ref-sun/[0.03] px-3 py-2"
            >
              <span className="text-meta text-slate-400">{line.label}</span>
              <span className="font-mono text-small tabular-nums text-slate-200">
                {line.value}
                {line.currency ? ` ${line.currency}` : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {dataNoteKey ? (
        <p className="text-meta text-slate-500 mt-3" role="note" data-tt-steward-governance-data-note="1">
          {t(dataNoteKey)}
        </p>
      ) : null}
    </section>
  );
}
