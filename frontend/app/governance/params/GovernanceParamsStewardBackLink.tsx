"use client";

import { useSearchParams } from "next/navigation";
import { GovernanceParamsStewardBackFromQuery } from "@/lib/governance/governanceParamsPageL5Ui";

export function GovernanceParamsStewardBackLink({ t }: { t: (key: string) => string }) {
  const searchParams = useSearchParams();
  return (
    <GovernanceParamsStewardBackFromQuery
      t={t}
      show={searchParams.get("from") === "steward_workbench"}
    />
  );
}
