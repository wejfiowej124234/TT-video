"use client";

import { useTranslation } from "@/components/LocaleProvider";

export type GovernanceOnChainProposalMeta = {
  proposer?: string | null;
  snapshot_block?: number;
  vote_start_block?: number;
  vote_end_block?: number;
  operation_id?: string | null;
};

type Props = {
  variant: "list" | "detail";
  /** From GET /governance/proposals when `data_source=governance_proposals_projection`, or null while loading */
  chainId?: number | null;
  /** From GET /meta `chain.contracts.governor_address` when available */
  governorAddress?: string | null;
  proposal?: GovernanceOnChainProposalMeta | null;
};

function AddrLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="mt-1 font-mono text-meta text-ink-800 dark:text-ink-100 break-all">
      <span className="font-sans font-medium text-ink-700 dark:text-ink-200">{label}: </span>
      {value}
    </p>
  );
}

/**
 * B-090 Completion · TT-COMP-B090-ONCHAIN-PROPOSAL-UI-001：链上提案（含国库 Treasury 支出类）Governor / Timelock 路径说明；
 * 地址与元数据仅展示 API/meta 真值，无占位伪造。
 */
export default function GovernanceB090OnChainProposalNotice({
  variant,
  chainId,
  governorAddress,
  proposal,
}: Props) {
  const { t } = useTranslation();

  return (
    <section
      className="rounded-[var(--radius-md)] border border-travel-500/25 bg-travel-500/5 p-4 dark:border-travel-400/20 dark:bg-travel-950/30"
      aria-label={t("governance_b090_onchain_notice_aria")}
    >
      <h2 className="text-small font-semibold text-ink-900 dark:text-ink-50">
        {variant === "list" ? t("governance_b090_onchain_list_title") : t("governance_b090_onchain_detail_title")}
      </h2>
      <p className="mt-2 text-body text-ink-700 dark:text-ink-200">{t("governance_b090_onchain_intro")}</p>
      <p className="mt-2 text-body text-ink-700 dark:text-ink-200">{t("governance_b090_onchain_treasury_body")}</p>
      {typeof chainId === "number" && Number.isFinite(chainId) ? (
        <p className="mt-2 text-meta text-ink-600 dark:text-ink-300">
          {t("governance_b090_onchain_chain_id_label")}: {chainId}
        </p>
      ) : null}
      {governorAddress && governorAddress.trim() ? (
        <AddrLine label={t("governance_b090_onchain_governor_label")} value={governorAddress.trim()} />
      ) : variant === "list" ? (
        <p className="mt-2 text-meta text-ink-500 dark:text-ink-400">{t("governance_b090_onchain_governor_unavailable")}</p>
      ) : null}
      {variant === "detail" && proposal ? (
        <div className="mt-3 space-y-1 border-t border-ink-200/60 pt-3 dark:border-ink-600/40">
          {proposal.proposer && String(proposal.proposer).trim() ? (
            <AddrLine label={t("governance_b090_onchain_proposer_label")} value={String(proposal.proposer).trim()} />
          ) : null}
          {typeof proposal.snapshot_block === "number" && Number.isFinite(proposal.snapshot_block) ? (
            <p className="text-meta text-ink-700 dark:text-ink-200">
              {t("governance_b090_onchain_snapshot_block_label")}: {proposal.snapshot_block}
            </p>
          ) : null}
          {typeof proposal.vote_start_block === "number" &&
          typeof proposal.vote_end_block === "number" &&
          Number.isFinite(proposal.vote_start_block) &&
          Number.isFinite(proposal.vote_end_block) ? (
            <p className="text-meta text-ink-700 dark:text-ink-200">
              {t("governance_b090_onchain_vote_window_label")}: {proposal.vote_start_block} — {proposal.vote_end_block}
            </p>
          ) : null}
          <div className="mt-2">
            <p className="text-small font-medium text-ink-800 dark:text-ink-100">
              {t("governance_b090_onchain_operation_id_heading")}
            </p>
            {proposal.operation_id != null && String(proposal.operation_id).trim() ? (
              <pre className="mt-1 max-w-full overflow-x-auto whitespace-pre-wrap break-all rounded border border-ink-200/80 bg-white p-2 font-mono text-meta text-ink-800 dark:border-ink-600/40 dark:bg-ink-950/40 dark:text-ink-100">
                {String(proposal.operation_id).trim()}
              </pre>
            ) : (
              <p className="mt-1 text-meta text-ink-600 dark:text-ink-400">{t("governance_b090_onchain_operation_id_none")}</p>
            )}
            <p className="mt-2 text-meta text-ink-600 dark:text-ink-300">{t("governance_b090_onchain_timelock_hint")}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
