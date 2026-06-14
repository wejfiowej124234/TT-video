"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { GovernanceChainMismatchActions } from "@/components/governance/GovernanceChainMismatchActions";
import { GOV_PROPOSALS_L5 } from "@/lib/governance/governanceProposalsListL5";
import { useAccount, useChainId, useConnect } from "wagmi";

type Props = {
  wrongNetwork: boolean;
  expectedChainId: number;
  compact?: boolean;
};

/** 治理页内钱包连接 · 行业 L5：页内 connector CTA + 一键切链 */
export function GovernanceWalletConnectPanel({ wrongNetwork, expectedChainId, compact = false }: Props) {
  const { t } = useTranslation();
  const { isConnected } = useAccount();
  const walletChainId = useChainId();
  const { connect, connectors, isPending } = useConnect();

  if (isConnected && !wrongNetwork) return null;

  return (
    <div
      className={`${GOV_PROPOSALS_L5.noticeSoft} ${compact ? "mt-2" : "mt-4"} space-y-3`}
      role="note"
      data-tt-governance-wallet-connect-panel="1"
    >
      {!isConnected ? (
        <>
          <p className={GOV_PROPOSALS_L5.cardHint}>{t("governance_wallet_connect_lead")}</p>
          <div className="flex flex-wrap gap-2">
            {connectors.slice(0, 3).map((c) => (
              <button
                key={c.uid}
                type="button"
                disabled={isPending}
                className={GOV_PROPOSALS_L5.primarySubmit}
                data-tt-governance-wallet-connect-btn="1"
                onClick={() => connect({ connector: c })}
              >
                {isPending ? t("wallet_connecting") : c.name}
              </button>
            ))}
          </div>
          <p className={GOV_PROPOSALS_L5.formHint}>{t("governance_wallet_connect_header_alt")}</p>
        </>
      ) : null}
      <GovernanceChainMismatchActions
        isConnected={isConnected}
        expectedChainId={expectedChainId}
        walletChainId={walletChainId}
      />
    </div>
  );
}
