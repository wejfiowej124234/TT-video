"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { GOV_PROPOSALS_L5 } from "@/lib/governance/governanceProposalsListL5";
import { getGovernanceExplorerTxUrl } from "@/lib/governance/governanceBlockExplorer";

type Props = {
  chainId: number;
  txHash: string;
  className?: string;
};

export function GovernanceTxExplorerLink({ chainId, txHash, className = "" }: Props) {
  const { t } = useTranslation();
  const url = getGovernanceExplorerTxUrl(chainId, txHash);
  if (!url) {
    return (
      <span className={`font-mono break-all ${GOV_PROPOSALS_L5.formHint} ${className}`} data-tt-governance-tx-hash="1">
        {txHash}
      </span>
    );
  }
  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${GOV_PROPOSALS_L5.inlineLink} font-mono break-all ${className}`}
      data-tt-governance-tx-explorer="1"
    >
      {t("governance_tx_view_explorer")}
    </Link>
  );
}
