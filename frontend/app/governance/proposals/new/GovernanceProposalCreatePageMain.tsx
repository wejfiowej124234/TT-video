"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import GovernanceTargetNotice from "@/components/governance/GovernanceTargetNotice";
import { GovernanceProposalCreateWizard } from "@/components/governance/GovernanceProposalCreateWizard";
import { GovernanceProposalsL5Shell } from "@/components/governance/GovernanceProposalsL5Shell";
import { GovernanceProposalsPageHeader } from "@/components/governance/GovernanceProposalsPageHeader";
import { GovernanceProposalsSubpageNav } from "@/components/governance/GovernanceProposalsSubpageNav";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { useGovernancePropose, useGovernanceProposeSimulate } from "@/dapp/hooks/useGovernancePropose";
import { useGovernanceProposerPower, useGovernanceWalletGate } from "@/dapp/hooks/useGovernanceWalletGate";
import { getMeStewardApplication, getMeta } from "@/lib/apiClient";
import { chainContractsFromMeta, chainIdFromMeta, governorAddressFromMeta } from "@/lib/governanceChainMeta";
import {
  emptyGovernanceProposalCreateDraft,
  type GovernanceCreateStepId,
} from "@/lib/governance/governanceProposalCreateModel";
import { GOV_PROPOSALS_L5, GovernanceProposalsL5Panel } from "@/lib/governance/governanceProposalsL5Ui";
import { governanceWalletAddressMismatch } from "@/lib/governance/governanceWalletGate";
import { mapWalletWriteError } from "@/lib/mapWalletWriteError";

export function GovernanceProposalCreatePageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const searchParams = useSearchParams();
  const fromSteward = searchParams.get("from") === "steward_workbench";

  const [step, setStep] = useState<GovernanceCreateStepId>("template");
  const [draft, setDraft] = useState(emptyGovernanceProposalCreateDraft);
  const [governorAddress, setGovernorAddress] = useState<`0x${string}` | null>(null);
  const [tokenAddress, setTokenAddress] = useState<`0x${string}` | null>(null);
  const [metaChainId, setMetaChainId] = useState<number | null>(null);
  const [contracts, setContracts] = useState<ReturnType<typeof chainContractsFromMeta>>(null);
  const [stewardWallet, setStewardWallet] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { address, chainReady, wrongNetwork, expectedChainId } = useGovernanceWalletGate(metaChainId);

  const {
    isConnected,
    proposalThresholdVotes,
    propose,
    hash,
    busy,
    isSuccess,
    error: walletError,
  } = useGovernancePropose(governorAddress, metaChainId);

  const { proposerVotes, proposerVotesLoading } = useGovernanceProposerPower(tokenAddress, metaChainId);

  const simulateOn = step === "submit";
  const { estimatedGas, simulateError } = useGovernanceProposeSimulate(
    governorAddress,
    draft,
    metaChainId,
    simulateOn,
  );
  const simulateHardBlock = simulateOn && Boolean(simulateError) && Boolean(governorAddress) && chainReady;
  const simulateWarn = simulateOn && Boolean(simulateError) && !simulateHardBlock;

  useEffect(() => {
    let cancelled = false;
    getMeta()
      .then((m) => {
        if (cancelled) return;
        const gov = governorAddressFromMeta(m);
        setGovernorAddress(gov && gov.startsWith("0x") ? (gov as `0x${string}`) : null);
        setContracts(chainContractsFromMeta(m));
        setMetaChainId(chainIdFromMeta(m));
        const token = chainContractsFromMeta(m)?.governance_token_address;
        setTokenAddress(token && token.startsWith("0x") ? (token as `0x${string}`) : null);
      })
      .catch(() => {
        if (!cancelled) {
          setGovernorAddress(null);
          setContracts(null);
          setMetaChainId(null);
          setTokenAddress(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!fromSteward) {
      setStewardWallet(null);
      return;
    }
    let cancelled = false;
    getMeStewardApplication()
      .then((raw) => {
        if (cancelled) return;
        const o = raw as { application?: { wallet_address?: string }; wallet_address?: string };
        const w = o?.application?.wallet_address ?? o?.wallet_address ?? null;
        setStewardWallet(typeof w === "string" && w.trim() ? w.trim() : null);
      })
      .catch(() => {
        if (!cancelled) setStewardWallet(null);
      });
    return () => {
      cancelled = true;
    };
  }, [fromSteward]);

  useEffect(() => {
    if (!walletError) return;
    setSubmitError(
      mapWalletWriteError(walletError, t, {
        revertPatterns: [
          {
            re: /GovernorInsufficientProposerVotes|InsufficientProposerVotes/i,
            messageKey: "governance_create_threshold_blocked",
          },
        ],
        rejectKey: "wallet_txErrorUserRejected",
        genericKey: "governance_create_submit_failed",
      }),
    );
  }, [walletError, t]);

  const walletMismatch = useMemo(
    () => fromSteward && governanceWalletAddressMismatch(address, stewardWallet),
    [address, fromSteward, stewardWallet],
  );

  const onDraftChange = useCallback((patch: Partial<typeof draft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const onSubmit = useCallback(() => {
    setSubmitError(null);
    propose(draft);
  }, [draft, propose]);

  const canSubmit = useMemo(() => Boolean(governorAddress), [governorAddress]);

  return (
    <GovernanceProposalsL5Shell width="narrow" pageKind="create" ariaLabelledBy={pageTitleId}>
      <GovernanceProposalsPageHeader
        pageTitleId={pageTitleId}
        kicker={t("governance_proposals_l5_kicker")}
        title={t("governance_proposals_create_title")}
        lead={t("governance_proposals_create_intro_l5")}
      />

      <p className={`${GOV_PROPOSALS_L5.noticeSoft} mt-4`} role="note">
        {t("governance_proposals_create_notice")}
      </p>

      <GovernanceTargetNotice className="mt-4" />

      <GovernanceProposalsSubpageNav t={t} />

      <GovernanceProposalsL5Panel className="mt-6">
        <GovernanceProposalCreateWizard
          step={step}
          draft={draft}
          onDraftChange={onDraftChange}
          onStepChange={setStep}
          contracts={contracts}
          proposalThresholdVotes={proposalThresholdVotes}
          proposerVotes={proposerVotes}
          proposerVotesLoading={proposerVotesLoading}
          isConnected={isConnected}
          chainReady={chainReady}
          wrongNetwork={wrongNetwork}
          expectedChainId={expectedChainId}
          walletMismatch={walletMismatch}
          expectedWallet={stewardWallet}
          estimatedGas={estimatedGas}
          simulateHardBlock={simulateHardBlock}
          simulateWarn={simulateWarn}
          canSubmit={canSubmit}
          submitBusy={busy}
          onSubmit={onSubmit}
          submitError={submitError}
          txHash={hash}
          txSuccess={isSuccess}
        />
      </GovernanceProposalsL5Panel>

      <ProductCrossNav
        ariaLabelKey="governance_subpage_relatedNav_aria"
        showGuides
        className={GOV_PROPOSALS_L5.crossNavWrap}
        linkClassName={GOV_PROPOSALS_L5.crossNavLink}
        separatorClassName={GOV_PROPOSALS_L5.crossNavSep}
      />
    </GovernanceProposalsL5Shell>
  );
}
