"use client";

import GovernanceSubrouteError from "@/components/governance/GovernanceSubrouteError";

export default function GovernanceDistributionAccrualDetailSegmentError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <GovernanceSubrouteError
      {...props}
      titleKey="governance_distribution_accruals_detail_title"
      dataTtRoot="governance-distribution-accrual-detail"
      logLabel="Governance distribution accrual detail"
    />
  );
}
