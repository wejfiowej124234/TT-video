"use client";

import { useTranslation } from "@/components/LocaleProvider";
import type { GovernanceProposalChainSnapshot, GovernanceProposalDetail } from "@/lib/apiClient/governance";
import type { ChainContractsSnapshot } from "@/lib/governanceChainMeta";
import {
  deriveGovernanceImpactTags,
  formatVotingPowerSnapshotForDisplay,
  impactTagI18nKey,
  type GovernanceImpactTagId,
} from "@/lib/governancePayloadImpact";

type Props = {
  onChainGovernor: boolean;
  proposal: GovernanceProposalDetail | undefined;
  hasCastVoteCalldata: boolean;
  chain?: GovernanceProposalChainSnapshot | null;
  contracts: ChainContractsSnapshot | null;
  votingPowerAtSnapshot: unknown | undefined;
};

function AddrRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="mt-1 font-mono text-meta text-ink-800 dark:text-ink-100 break-all">
      <span className="font-sans font-medium text-ink-700 dark:text-ink-200">{label}</span>
      {value}
    </p>
  );
}

/**
 * B-408：影响标签 + 协议地址（meta 759）+ 可证时间轴字段；执行层 targets/calldatas 以 API 边界说明为准。
 */
export default function GovernanceProposalImpactPanel({
  onChainGovernor,
  proposal,
  hasCastVoteCalldata,
  chain,
  contracts,
  votingPowerAtSnapshot,
}: Props) {
  const { t } = useTranslation();

  if (!onChainGovernor || !proposal) return null;

  const tags = deriveGovernanceImpactTags({
    onChainGovernor,
    chain: chain ?? undefined,
    hasCastVoteCalldata,
    operationId: proposal.operation_id,
  });

  const seen = new Set<GovernanceImpactTagId>();
  const uniqueTags = tags.filter((id) => {
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  return (
    <section
      className="rounded-[var(--radius-md)] border border-ink-200/90 bg-white/80 p-4 dark:border-ink-600/40 dark:bg-ink-950/40"
      aria-labelledby="gov-impact-heading"
    >
      <h2 id="gov-impact-heading" className="text-small font-semibold text-ink-900 dark:text-ink-50">
        {t("governance_impact_section_heading")}
      </h2>
      <p className="mt-2 text-meta text-ink-600 dark:text-ink-300">{t("governance_impact_section_lead")}</p>

      <div className="mt-3 flex flex-wrap gap-2" role="list" aria-label={t("governance_impact_tags_aria")}>
        {uniqueTags.map((id) => (
          <span
            key={id}
            role="listitem"
            className="inline-flex max-w-full items-center rounded-full border border-travel-500/35 bg-travel-500/10 px-2.5 py-1 text-meta text-ink-800 dark:border-travel-400/30 dark:bg-travel-950/40 dark:text-ink-100"
          >
            {t(impactTagI18nKey(id))}
          </span>
        ))}
      </div>

      {contracts ? (
        <div className="mt-4 border-t border-ink-200/70 pt-3 dark:border-ink-600/40">
          <h3 className="text-small font-semibold text-ink-800 dark:text-ink-100">
            {t("governance_impact_protocol_contracts_heading")}
          </h3>
          <p className="mt-1 text-meta text-ink-600 dark:text-ink-300">{t("governance_impact_protocol_contracts_note")}</p>
          {contracts.governor_address ? (
            <AddrRow label={`${t("governance_impact_label_governor")}: `} value={contracts.governor_address} />
          ) : null}
          {contracts.timelock_address ? (
            <AddrRow label={`${t("governance_impact_label_timelock")}: `} value={contracts.timelock_address} />
          ) : null}
          {contracts.governance_token_address ? (
            <AddrRow label={`${t("governance_impact_label_governance_token")}: `} value={contracts.governance_token_address} />
          ) : null}
          {contracts.treasury_address ? (
            <AddrRow label={`${t("governance_impact_label_treasury")}: `} value={contracts.treasury_address} />
          ) : null}
          {contracts.fee_router_address ? (
            <AddrRow label={`${t("governance_impact_label_fee_router")}: `} value={contracts.fee_router_address} />
          ) : null}
          {contracts.guide_staking_address ? (
            <AddrRow label={`${t("governance_impact_label_guide_staking")}: `} value={contracts.guide_staking_address} />
          ) : null}
          {contracts.staking_provider_address ? (
            <AddrRow label={`${t("governance_impact_label_provider_staking")}: `} value={contracts.staking_provider_address} />
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 border-t border-ink-200/70 pt-3 dark:border-ink-600/40">
        <h3 className="text-small font-semibold text-ink-800 dark:text-ink-100">{t("governance_impact_timeline_heading")}</h3>
        <ul className="mt-2 list-inside list-disc text-meta text-ink-700 dark:text-ink-200">
          {typeof proposal.snapshot_block === "number" && Number.isFinite(proposal.snapshot_block) ? (
            <li>
              {t("governance_impact_timeline_snapshot")}: {proposal.snapshot_block}
            </li>
          ) : null}
          {typeof proposal.vote_start_block === "number" &&
          typeof proposal.vote_end_block === "number" &&
          Number.isFinite(proposal.vote_start_block) &&
          Number.isFinite(proposal.vote_end_block) ? (
            <li>
              {t("governance_impact_timeline_vote_window")}: {proposal.vote_start_block} — {proposal.vote_end_block}
            </li>
          ) : null}
          {proposal.operation_id != null && String(proposal.operation_id).trim() ? (
            <li>{t("governance_impact_timeline_queued_operation")}</li>
          ) : (
            <li>{t("governance_impact_timeline_operation_pending")}</li>
          )}
        </ul>
      </div>

      <div className="mt-4 border-t border-ink-200/70 pt-3 dark:border-ink-600/40">
        <h3 className="text-small font-semibold text-ink-800 dark:text-ink-100">{t("governance_impact_exec_payload_heading")}</h3>
        <p className="mt-2 text-body text-ink-700 dark:text-ink-200">{t("governance_impact_exec_payload_body")}</p>
      </div>

      {votingPowerAtSnapshot != null ? (
        <div className="mt-4 border-t border-ink-200/70 pt-3 dark:border-ink-600/40">
          <h3 className="text-small font-semibold text-ink-800 dark:text-ink-100">
            {t("governance_impact_voting_power_snapshot_heading")}
          </h3>
          <p className="mt-1 text-meta text-ink-600 dark:text-ink-300">{t("governance_impact_voting_power_snapshot_note")}</p>
          <pre className="mt-2 max-w-full overflow-x-auto rounded border border-ink-200/80 bg-white p-2 text-meta text-ink-800 dark:border-ink-600/40 dark:bg-ink-950/40 dark:text-ink-100">
            {formatVotingPowerSnapshotForDisplay(votingPowerAtSnapshot)}
          </pre>
        </div>
      ) : null}
    </section>
  );
}
