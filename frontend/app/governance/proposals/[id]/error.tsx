"use client";

import GovernanceSubrouteError from "@/components/governance/GovernanceSubrouteError";

export default function GovernanceProposalDetailSegmentError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <GovernanceSubrouteError
      {...props}
      titleKey="governance_proposal_detail_title"
      dataTtRoot="governance-proposal-detail"
      logLabel="Governance proposal detail"
    />
  );
}
