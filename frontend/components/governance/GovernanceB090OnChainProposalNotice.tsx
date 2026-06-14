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
  /** L5：列表页默认折叠技术细节，详情页保持完整 */
  compact?: boolean;
  chainId?: number | null;
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

function GovernanceB090TechnicalBody({ variant, chainId, governorAddress, proposal }: Omit<Props, "compact">) {
  const { t } = useTranslation();
  return (
    <>
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
    </>
  );
}

/**
 * B-090 · 链上提案 Governor / Timelock 路径说明；compact 模式供 L5 列表页折叠技术块。
 */
export default function GovernanceB090OnChainProposalNotice({
  variant,
  compact = false,
  chainId,
  governorAddress,
  proposal,
}: Props) {
  const { t } = useTranslation();
  const titleKey = variant === "list" ? "governance_b090_onchain_list_title" : "governance_b090_onchain_detail_title";

  if (compact && variant === "list") {
    return (
      <details
        className="rounded-[var(--radius-md)] border border-travel-500/20 bg-travel-500/5 p-4 dark:border-travel-400/15 dark:bg-travel-950/25"
        aria-label={t("governance_b090_onchain_notice_aria")}
      >
        <summary className="cursor-pointer text-small font-semibold text-ink-900 dark:text-ink-50">
          {t("governance_b090_onchain_compact_summary")}
        </summary>
        <div className="mt-3">
          <p className="text-body text-ink-700 dark:text-ink-200">{t("governance_b090_onchain_intro")}</p>
          <GovernanceB090TechnicalBody
            variant={variant}
            chainId={chainId}
            governorAddress={governorAddress}
            proposal={proposal}
          />
        </div>
      </details>
    );
  }

  return (
    <section
      className="rounded-[var(--radius-md)] border border-travel-500/25 bg-travel-500/5 p-4 dark:border-travel-400/20 dark:bg-travel-950/30"
      aria-label={t("governance_b090_onchain_notice_aria")}
    >
      <h2 className="text-small font-semibold text-ink-900 dark:text-ink-50">{t(titleKey)}</h2>
      <p className="mt-2 text-body text-ink-700 dark:text-ink-200">{t("governance_b090_onchain_intro")}</p>
      <GovernanceB090TechnicalBody
        variant={variant}
        chainId={chainId}
        governorAddress={governorAddress}
        proposal={proposal}
      />
    </section>
  );
}
