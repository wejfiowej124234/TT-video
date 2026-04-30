"use client";

import GovernanceSubrouteError from "@/components/governance/GovernanceSubrouteError";

export default function GovernanceVaultForwardsSegmentError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <GovernanceSubrouteError
      {...props}
      titleKey="governance_vault_forwards_title"
      dataTtRoot="governance-vault-forwards"
      logLabel="Governance vault forwards"
    />
  );
}
