"use client";

import GovernanceSubrouteError from "@/components/governance/GovernanceSubrouteError";

export default function GovernanceDelegateSegmentError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <GovernanceSubrouteError
      {...props}
      titleKey="governance_delegate_title"
      dataTtRoot="governance-delegate"
      logLabel="Governance delegate"
    />
  );
}
