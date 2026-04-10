"use client";

import { useMemo } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import type { GovernanceProposalChainSnapshot } from "@/lib/apiClient/governance";
import {
  deriveGovernanceExecutionReadiness,
  governanceExecReadinessDetailKey,
  GOV_EXEC_READINESS_DESC_ID,
  GOV_EXEC_READINESS_VOTE_FOOTER_ID,
  type GovernanceExecutionReadiness,
} from "@/lib/governanceExecutionReadiness";

export type GovernanceProposalExecutionReadinessPanelProps = {
  className?: string;
  onChainGovernor: boolean;
  chain?: GovernanceProposalChainSnapshot | null;
};

/**
 * 详情页：执行路径只读说明（数据仅来自详情 `chain` 字段）。
 */
export default function GovernanceProposalExecutionReadinessPanel({
  className,
  onChainGovernor,
  chain,
}: GovernanceProposalExecutionReadinessPanelProps) {
  const { t } = useTranslation();
  const root = className?.trim() ? className : "";
  const readiness = useMemo(
    () => deriveGovernanceExecutionReadiness(onChainGovernor, chain),
    [onChainGovernor, chain],
  );
  const detailKey = governanceExecReadinessDetailKey(readiness);

  return (
    <section
      className={`rounded-[var(--radius-md)] border border-ink-200/90 bg-white/80 p-3 dark:border-ink-600/45 dark:bg-ink-950/30 ${root}`}
      aria-labelledby="gov-exec-readiness-heading"
    >
      <h4 id="gov-exec-readiness-heading" className="text-small font-semibold text-ink-900 dark:text-ink-50">
        {t("governance_exec_readiness_section_heading")}
      </h4>
      <p id={GOV_EXEC_READINESS_DESC_ID} className="mt-1 text-body text-ink-800 dark:text-ink-100" role="status">
        {t(detailKey)}
      </p>
      {onChainGovernor && readiness.sourceState ? (
        <p className="mt-1 font-mono text-meta text-ink-700 dark:text-ink-200" translate="no">
          {readiness.sourceState}
        </p>
      ) : null}
    </section>
  );
}

export type GovernanceProposalExecutionVoteFooterProps = {
  className?: string;
  readiness: GovernanceExecutionReadiness;
  onChainGovernor: boolean;
};

/** 紧贴投票按钮上方：链上模式下与说明区共用同一套分类文案 */
export function GovernanceProposalExecutionVoteFooter({
  className,
  readiness,
  onChainGovernor,
}: GovernanceProposalExecutionVoteFooterProps) {
  const { t } = useTranslation();
  if (!onChainGovernor) return null;
  const root = className?.trim() ? className : "";
  const detailKey = governanceExecReadinessDetailKey(readiness);

  return (
    <p
      id={GOV_EXEC_READINESS_VOTE_FOOTER_ID}
      className={`text-meta text-ink-600 dark:text-ink-300 ${root}`}
      role="status"
    >
      <span className="font-medium text-ink-700 dark:text-ink-200">
        {t("governance_exec_readiness_vote_buttons_readonly_lead")}
      </span>{" "}
      {t(detailKey)}
    </p>
  );
}
