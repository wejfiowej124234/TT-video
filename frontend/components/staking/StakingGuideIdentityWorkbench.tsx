"use client";

import { useId } from "react";
import { useAccount, useChainId } from "wagmi";

import { useTranslation } from "@/components/LocaleProvider";
import { getExpectedChainId } from "@/lib/chainEnv";
import { getGuideStakingAddress } from "@/lib/stakingEnv";
import { TT_STAKING_PAGE_L5 } from "@/lib/staking/stakingPageL5";
import { useGuideOnChainStakeAmount } from "@/lib/staking/useGuideOnChainStakeAmount";

import GuideIdentityStakingOpsGate from "./GuideIdentityStakingOpsGate";
import { StakingApiChainMismatchBanner } from "./StakingApiChainMismatchBanner";
import { StakingIdentitySummaryStrip } from "./StakingIdentitySummaryStrip";
import { StakingNotDeployedCallout } from "./StakingNotDeployedCallout";
import { StakingOpsUnavailableNote } from "./StakingOpsUnavailableNote";
import { StakingPanelDisconnectedState } from "./StakingPanelDisconnectedState";
import { StakingStakePanel } from "./StakingStakePanel";
import { StakingTechnicalDetailsCollapsible } from "./StakingTechnicalDetailsCollapsible";
import { StakingWithdrawPanel } from "./StakingWithdrawPanel";
import { StakingWrongChainNote } from "./StakingWrongChainNote";
import type { StakingPanelVariant } from "./StakingContractPanel";

type StakingGuideIdentityWorkbenchProps = {
  panelVariant?: StakingPanelVariant;
  poolMissing?: boolean;
};

/**
 * 向导 scope 统一工作台（L5 · 单卡三层：摘要 → 操作双栏 → 技术折叠）
 * 替代 ContractPanel + StakePanel + WithdrawPanel 三连独立大卡。
 */
export function StakingGuideIdentityWorkbench({
  panelVariant = "warm",
  poolMissing = false,
}: StakingGuideIdentityWorkbenchProps) {
  const { t } = useTranslation();
  const opsTitleId = useId();
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const expectedChainId = getExpectedChainId();
  const stakingAddress = getGuideStakingAddress() ?? "";
  const chainWrong = isConnected && chainId !== expectedChainId;
  const opsBlocked = poolMissing || chainWrong;
  const { amount: onChainStake, loading: onChainStakeLoading } = useGuideOnChainStakeAmount();
  const hasWithdrawableStake =
    isConnected &&
    !opsBlocked &&
    !onChainStakeLoading &&
    onChainStake != null &&
    Number.parseFloat(onChainStake) > 0;

  return (
    <div className={TT_STAKING_PAGE_L5.panelStack} data-tt-staking-guide-workbench="1">
      <section className={TT_STAKING_PAGE_L5.panelCard} aria-labelledby={opsTitleId}>
        <h2 id={opsTitleId} className={TT_STAKING_PAGE_L5.panelTitle}>
          {t("staking_guide_workbench_title")}
        </h2>
        <p className={`${TT_STAKING_PAGE_L5.panelSubtitle} max-w-2xl`}>
          {t("staking_guide_workbench_subtitle")}
        </p>

        <div className="mt-4 space-y-3">
          <StakingIdentitySummaryStrip suppressBelowMinHint />
          <StakingApiChainMismatchBanner enabled={isConnected && !opsBlocked} />
        </div>

        <StakingOpsUnavailableNote visible={poolMissing && !isConnected} />

        <GuideIdentityStakingOpsGate>
          {!isConnected ? (
            <div className="mt-5">
              <StakingPanelDisconnectedState compact />
            </div>
          ) : opsBlocked ? (
            <div className="mt-6 border-t border-ref-sun/14 pt-6" data-tt-staking-guide-ops-blocked="1">
              {chainWrong ? (
                <StakingWrongChainNote currentChainId={chainId} expectedChainId={expectedChainId} />
              ) : poolMissing && stakingAddress ? (
                <StakingNotDeployedCallout
                  chainId={chainId}
                  expectedChainId={expectedChainId}
                  contractAddress={stakingAddress}
                  variant={panelVariant}
                />
              ) : (
                <p className={TT_STAKING_PAGE_L5.metaProse}>{t("staking_ops_unavailableCompact")}</p>
              )}
            </div>
          ) : (
            <div
              className={`mt-6 grid gap-6 border-t border-ref-sun/14 pt-6 ${
                hasWithdrawableStake ? "lg:grid-cols-2" : "lg:grid-cols-1"
              }`}
              data-tt-staking-guide-ops-grid="1"
            >
              <StakingStakePanel pool="guide" panelVariant={panelVariant} embedded />
              {hasWithdrawableStake ? (
                <StakingWithdrawPanel pool="guide" panelVariant={panelVariant} embedded />
              ) : null}
            </div>
          )}
        </GuideIdentityStakingOpsGate>
      </section>

      <StakingTechnicalDetailsCollapsible pool="guide" />
    </div>
  );
}
