"use client";

import GovernanceSubrouteError from "@/components/governance/GovernanceSubrouteError";

export default function GovernanceProposalsListSegmentError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <GovernanceSubrouteError
      {...props}
      titleKey="governance_proposals_title"
      dataTtRoot="governance-proposals-list"
      logLabel="Governance proposals list"
    />
  );
}
