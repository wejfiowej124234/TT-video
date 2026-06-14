"use client";

import { Suspense } from "react";
import LoadingText from "@/components/LoadingText";
import { GovernanceProposalCreatePageMain } from "./GovernanceProposalCreatePageMain";

export default function GovernanceProposalCreatePage() {
  return (
    <Suspense fallback={<LoadingText />}>
      <GovernanceProposalCreatePageMain />
    </Suspense>
  );
}
