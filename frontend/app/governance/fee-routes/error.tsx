"use client";

import GovernanceSubrouteError from "@/components/governance/GovernanceSubrouteError";

export default function GovernanceFeeRoutesSegmentError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <GovernanceSubrouteError
      {...props}
      titleKey="governance_fee_routes_title"
      dataTtRoot="governance-fee-routes"
      logLabel="Governance fee routes"
    />
  );
}
