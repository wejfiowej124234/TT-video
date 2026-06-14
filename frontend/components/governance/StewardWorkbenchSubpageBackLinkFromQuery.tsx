"use client";

import { useSearchParams } from "next/navigation";
import { StewardWorkbenchSubpageBackLink } from "@/components/governance/StewardWorkbenchSubpageBackLink";

export function StewardWorkbenchSubpageBackLinkFromQuery({ t }: { t: (key: string) => string }) {
  const searchParams = useSearchParams();
  if (searchParams.get("from") !== "steward_workbench") return null;
  return <StewardWorkbenchSubpageBackLink t={t} />;
}
