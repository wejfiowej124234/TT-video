"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import { GovernanceHubPageMain } from "./GovernanceHubPageMain";
import { StewardRegionWorkbenchMain } from "./StewardRegionWorkbenchMain";
import { WorkspaceL5PageSkeleton } from "@/components/workspace/WorkspaceL5PageSkeleton";

function GovernancePageRouterInner() {
  const searchParams = useSearchParams();
  const isRegionWorkbench = searchParams?.get("view") === "region";
  if (isRegionWorkbench) {
    return <StewardRegionWorkbenchMain />;
  }
  return <GovernanceHubPageMain />;
}

/** 13-1 表 2 · C-GOV-001：治理 hub；区域主理人工作台 `?view=region` */
export default function GovernancePage() {
  const { t } = useTranslation();
  return (
    <Suspense
      fallback={
        <WorkspaceL5PageSkeleton t={t} kind="steward" ariaLabelKey="governance_title" />
      }
    >
      <GovernancePageRouterInner />
    </Suspense>
  );
}
