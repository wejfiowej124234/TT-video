"use client";

import { useMemo } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { GovernanceWalletConnectPanel } from "@/components/governance/GovernanceWalletConnectPanel";
import { GOV_PROPOSALS_L5 } from "@/lib/governance/governanceProposalsListL5";
import type {
  GovernanceProposalAction,
  GovernanceProposalCreateDraft,
  GovernanceProposalTemplateId,
} from "@/lib/governance/governanceProposalCreateModel";
import { GovernanceTxExplorerLink } from "@/components/governance/GovernanceTxExplorerLink";
import {
  GOVERNANCE_CREATE_STEPS,
  GOVERNANCE_PROPOSE_MAX_ACTIONS,
  GOVERNANCE_TIMELOCK_MAX_ACTIONS,
  canAdvanceGovernanceCreateStep,
  deriveGovernanceProposalRiskTags,
  governanceDraftActions,
  isGovernanceDraftTimelockCompatible,
  syncDraftPrimaryAction,
  type GovernanceCreateStepId,
} from "@/lib/governance/governanceProposalCreateModel";
import { buildGovernanceTemplateActionPreset } from "@/lib/governance/governanceProposalTemplateCalldata";
import { formatTtgAmount } from "@/lib/steward/stewardStakeUiModel";
import type { ChainContractsSnapshot } from "@/lib/governanceChainMeta";

const TEMPLATE_IDS: GovernanceProposalTemplateId[] = [
  "platform_params",
  "treasury",
  "region",
  "did",
  "emergency",
  "custom",
];

type Props = {
  step: GovernanceCreateStepId;
  draft: GovernanceProposalCreateDraft;
  onDraftChange: (patch: Partial<GovernanceProposalCreateDraft>) => void;
  onStepChange: (step: GovernanceCreateStepId) => void;
  contracts: ChainContractsSnapshot | null;
  proposalThresholdVotes?: bigint;
  proposerVotes?: bigint;
  proposerVotesLoading?: boolean;
  isConnected: boolean;
  chainReady: boolean;
  wrongNetwork: boolean;
  expectedChainId: number;
  walletMismatch?: boolean;
  expectedWallet?: string | null;
  estimatedGas?: bigint | null;
  simulateHardBlock?: boolean;
  simulateWarn?: boolean;
  canSubmit: boolean;
  submitBusy: boolean;
  onSubmit: () => void;
  submitError: string | null;
  txHash?: string;
  txSuccess?: boolean;
};

function patchAction(
  draft: GovernanceProposalCreateDraft,
  index: number,
  patch: Partial<GovernanceProposalAction>,
): GovernanceProposalCreateDraft {
  const actions = draft.actions.map((row, i) => (i === index ? { ...row, ...patch } : row));
  return syncDraftPrimaryAction({ ...draft, actions });
}

export function GovernanceProposalCreateWizard({
  step,
  draft,
  onDraftChange,
  onStepChange,
  contracts,
  proposalThresholdVotes,
  proposerVotes,
  proposerVotesLoading,
  isConnected,
  chainReady,
  wrongNetwork,
  expectedChainId,
  walletMismatch = false,
  expectedWallet,
  estimatedGas,
  simulateHardBlock = false,
  simulateWarn = false,
  canSubmit,
  submitBusy,
  onSubmit,
  submitError,
  txHash,
  txSuccess,
}: Props) {
  const { t } = useTranslation();
  const stepIndex = GOVERNANCE_CREATE_STEPS.indexOf(step);
  const riskTags = useMemo(() => deriveGovernanceProposalRiskTags(draft, contracts), [draft, contracts]);
  const actions = governanceDraftActions(draft);

  const meetsThreshold = useMemo(() => {
    if (proposalThresholdVotes === undefined || proposerVotes === undefined) return null;
    return proposerVotes >= proposalThresholdVotes;
  }, [proposalThresholdVotes, proposerVotes]);

  const fieldClass = GOV_PROPOSALS_L5.formField;

  const timelockCompatible = isGovernanceDraftTimelockCompatible(draft);

  const submitDisabled =
    !canSubmit ||
    submitBusy ||
    meetsThreshold === false ||
    !chainReady ||
    walletMismatch ||
    simulateHardBlock;

  return (
    <div className="space-y-6" data-tt-governance-proposal-create-wizard="1">
      <GovernanceWalletConnectPanel wrongNetwork={wrongNetwork} expectedChainId={expectedChainId} />

      <ol className="flex flex-wrap gap-2 text-meta" aria-label={t("governance_create_steps_aria")}>
        {GOVERNANCE_CREATE_STEPS.map((id, i) => (
          <li
            key={id}
            className={
              i === stepIndex
                ? GOV_PROPOSALS_L5.wizardStepActive
                : i < stepIndex
                  ? GOV_PROPOSALS_L5.wizardStepDone
                  : GOV_PROPOSALS_L5.wizardStepIdle
            }
          >
            {t(`governance_create_step_${id}`)}
          </li>
        ))}
      </ol>

      {step === "template" ? (
        <section className="grid gap-2 sm:grid-cols-2">
          {TEMPLATE_IDS.map((id) => (
            <button
              key={id}
              type="button"
              className={
                draft.templateId === id ? GOV_PROPOSALS_L5.templateCardActive : GOV_PROPOSALS_L5.templateCardIdle
              }
              onClick={() => {
                const preset = buildGovernanceTemplateActionPreset(id, contracts);
                if (preset) {
                  onDraftChange(
                    syncDraftPrimaryAction({
                      ...draft,
                      templateId: id,
                      actions: [
                        {
                          targetAddress: preset.targetAddress,
                          calldataHex: preset.calldataHex,
                          ethValue: preset.ethValue,
                        },
                      ],
                    }),
                  );
                } else {
                  onDraftChange({ templateId: id });
                }
              }}
            >
              <p className={`text-small font-semibold text-slate-50`}>{t(`governance_create_template_${id}_title`)}</p>
              <p className={`mt-1 ${GOV_PROPOSALS_L5.formHint}`}>{t(`governance_create_template_${id}_body`)}</p>
            </button>
          ))}
        </section>
      ) : null}

      {step === "details" ? (
        <section className="space-y-4">
          <div>
            <label htmlFor="gov-create-title" className={GOV_PROPOSALS_L5.formLabel}>
              {t("governance_create_field_title")}
            </label>
            <input
              id="gov-create-title"
              className={fieldClass}
              value={draft.title}
              onChange={(e) => onDraftChange({ title: e.target.value })}
              maxLength={120}
            />
          </div>
          <div>
            <label htmlFor="gov-create-summary" className={GOV_PROPOSALS_L5.formLabel}>
              {t("governance_create_field_summary")}
            </label>
            <textarea
              id="gov-create-summary"
              className={`${fieldClass} min-h-[120px]`}
              value={draft.summary}
              onChange={(e) => onDraftChange({ summary: e.target.value })}
              maxLength={4000}
            />
          </div>
        </section>
      ) : null}

      {step === "action" ? (
        <section className="space-y-4">
          <label className={`flex items-center gap-2 ${GOV_PROPOSALS_L5.formLabel}`}>
            <input
              type="checkbox"
              checked={draft.advancedMode}
              onChange={(e) => onDraftChange({ advancedMode: e.target.checked })}
            />
            {t("governance_create_advanced_mode")}
          </label>
          {actions.map((action, index) => (
            <div
              key={index}
              className={`${GOV_PROPOSALS_L5.noticeSoft} space-y-3`}
              data-tt-governance-propose-action-row={index}
            >
              <p className={`text-small font-semibold text-slate-50`}>
                {t("governance_create_action_row_title", { n: index + 1 })}
              </p>
              <div>
                <label htmlFor={`gov-create-target-${index}`} className={GOV_PROPOSALS_L5.formLabel}>
                  {t("governance_create_field_target")}
                </label>
                <input
                  id={`gov-create-target-${index}`}
                  className={fieldClass}
                  value={action.targetAddress}
                  onChange={(e) => onDraftChange(patchAction(draft, index, { targetAddress: e.target.value }))}
                  placeholder="0x…"
                />
              </div>
              <div>
                <label htmlFor={`gov-create-calldata-${index}`} className={GOV_PROPOSALS_L5.formLabel}>
                  {t("governance_create_field_calldata")}
                </label>
                <textarea
                  id={`gov-create-calldata-${index}`}
                  className={`${fieldClass} min-h-[96px] font-mono text-meta`}
                  value={action.calldataHex}
                  onChange={(e) => onDraftChange(patchAction(draft, index, { calldataHex: e.target.value }))}
                  placeholder="0x"
                />
              </div>
              {draft.advancedMode || index > 0 ? (
                <div>
                  <label htmlFor={`gov-create-value-${index}`} className={GOV_PROPOSALS_L5.formLabel}>
                    {t("governance_create_field_value")}
                  </label>
                  <input
                    id={`gov-create-value-${index}`}
                    className={fieldClass}
                    value={action.ethValue}
                    onChange={(e) => onDraftChange(patchAction(draft, index, { ethValue: e.target.value }))}
                  />
                </div>
              ) : null}
              {actions.length > 1 ? (
                <button
                  type="button"
                  className={GOV_PROPOSALS_L5.retryBtn}
                  onClick={() => {
                    const next = draft.actions.filter((_, i) => i !== index);
                    onDraftChange(syncDraftPrimaryAction({ ...draft, actions: next.length ? next : draft.actions }));
                  }}
                >
                  {t("governance_create_action_remove")}
                </button>
              ) : null}
            </div>
          ))}
          {draft.actions.length < GOVERNANCE_PROPOSE_MAX_ACTIONS ? (
            <button
              type="button"
              className={GOV_PROPOSALS_L5.retryBtn}
              data-tt-governance-propose-add-action="1"
              onClick={() =>
                onDraftChange(
                  syncDraftPrimaryAction({
                    ...draft,
                    actions: [
                      ...draft.actions,
                      { targetAddress: "", calldataHex: "0x", ethValue: "0" },
                    ],
                  }),
                )
              }
            >
              {t("governance_create_action_add")}
            </button>
          ) : null}
          {!timelockCompatible ? (
            <p className="text-body text-amber-200" role="note" data-tt-governance-timelock-multi-warn="1">
              {t("governance_create_timelock_single_action_warn", { max: GOVERNANCE_TIMELOCK_MAX_ACTIONS })}
            </p>
          ) : null}
        </section>
      ) : null}

      {step === "risk" ? (
        <section className={`${GOV_PROPOSALS_L5.noticeSoft} space-y-2`}>
          <h2 className={`text-small font-semibold text-slate-50`}>{t("governance_create_risk_heading")}</h2>
          <p className={GOV_PROPOSALS_L5.cardHint}>{t("governance_create_risk_lead")}</p>
          <ul className="flex flex-wrap gap-2">
            {riskTags.length === 0 ? (
              <li className={GOV_PROPOSALS_L5.formHint}>{t("governance_create_risk_none")}</li>
            ) : (
              riskTags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-rose-400/35 bg-rose-500/10 px-2.5 py-1 text-meta text-rose-200"
                >
                  {t(`governance_create_risk_tag_${tag}`)}
                </li>
              ))
            )}
          </ul>
        </section>
      ) : null}

      {step === "submit" ? (
        <section className={`${GOV_PROPOSALS_L5.noticeSoft} space-y-3`}>
          <h2 className={`text-small font-semibold text-slate-50`}>{t("governance_create_review_heading")}</h2>
          <p className={GOV_PROPOSALS_L5.cardHint}>
            <span className="font-medium">{t("governance_create_field_title")}:</span> {draft.title.trim() || "—"}
          </p>
          <p className={`whitespace-pre-wrap ${GOV_PROPOSALS_L5.cardHint}`}>{draft.summary.trim() || "—"}</p>
          <p className={GOV_PROPOSALS_L5.formHint}>
            {t("governance_create_action_count_review", { count: actions.length })}
          </p>
          {proposerVotesLoading ? (
            <p className={GOV_PROPOSALS_L5.formHint}>{t("governance_create_proposer_power_loading")}</p>
          ) : proposerVotes !== undefined && proposalThresholdVotes !== undefined ? (
            <p className={GOV_PROPOSALS_L5.formHint} data-tt-governance-proposer-power="1">
              {t("governance_create_proposer_power_onchain", {
                votes: formatTtgAmount(proposerVotes, 18),
                threshold: formatTtgAmount(proposalThresholdVotes, 18),
              })}
            </p>
          ) : null}
          {meetsThreshold === false ? (
            <p className="text-body text-rose-300" role="alert">
              {t("governance_create_threshold_blocked")}
            </p>
          ) : null}
          {walletMismatch && expectedWallet ? (
            <p className="text-body text-rose-300" role="alert" data-tt-governance-steward-wallet-mismatch="1">
              {t("governance_create_steward_wallet_mismatch", { expected: expectedWallet })}
            </p>
          ) : null}
          {simulateHardBlock ? (
            <p className="text-body text-rose-300" role="alert">
              {t("governance_create_simulate_failed")}
            </p>
          ) : null}
          {simulateWarn ? (
            <p className={`${GOV_PROPOSALS_L5.formHint}`} role="note">
              {t("governance_create_simulate_warn")}
            </p>
          ) : null}
          {estimatedGas != null ? (
            <p className={GOV_PROPOSALS_L5.formHint} data-tt-governance-propose-gas-estimate="1">
              {t("governance_create_gas_estimate", { gas: estimatedGas.toString() })}
            </p>
          ) : null}
          {submitError ? <p className="text-body text-rose-300">{submitError}</p> : null}
          {txHash ? (
            <p className={`${GOV_PROPOSALS_L5.formHint}`}>
              {t("governance_onchain_vote_tx_submitted")}:{" "}
              <GovernanceTxExplorerLink chainId={expectedChainId} txHash={txHash} />
            </p>
          ) : null}
          {txSuccess ? (
            <p className="text-body text-emerald-300">{t("governance_create_submit_success")}</p>
          ) : null}
          <button
            type="button"
            className={GOV_PROPOSALS_L5.primarySubmit}
            disabled={submitDisabled}
            data-tt-governance-propose-submit="1"
            onClick={onSubmit}
          >
            {submitBusy ? t("governance_create_submitting") : t("governance_create_submit_cta")}
          </button>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {stepIndex > 0 ? (
          <button
            type="button"
            className={`${GOV_PROPOSALS_L5.retryBtn} !inline-flex`}
            onClick={() => onStepChange(GOVERNANCE_CREATE_STEPS[stepIndex - 1]!)}
          >
            {t("governance_create_back")}
          </button>
        ) : null}
        {step !== "submit" ? (
          <button
            type="button"
            className={GOV_PROPOSALS_L5.primarySubmit}
            disabled={!canAdvanceGovernanceCreateStep(step, draft)}
            onClick={() => onStepChange(GOVERNANCE_CREATE_STEPS[stepIndex + 1]!)}
          >
            {t("governance_create_next")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
