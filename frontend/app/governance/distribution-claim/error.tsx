"use client";

import GovernanceSubrouteError from "@/components/governance/GovernanceSubrouteError";

export default function GovernanceDistributionClaimSegmentError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <GovernanceSubrouteError
      {...props}
      titleKey="governance_claim_title"
      dataTtRoot="governance-distribution-claim"
      logLabel="Governance distribution claim"
    />
  );
}
