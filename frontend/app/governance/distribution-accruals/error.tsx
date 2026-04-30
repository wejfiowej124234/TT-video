"use client";

import GovernanceSubrouteError from "@/components/governance/GovernanceSubrouteError";

export default function GovernanceDistributionAccrualsListSegmentError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <GovernanceSubrouteError
      {...props}
      titleKey="governance_distribution_accruals_title"
      dataTtRoot="governance-distribution-accruals-list"
      logLabel="Governance distribution accruals list"
    />
  );
}
