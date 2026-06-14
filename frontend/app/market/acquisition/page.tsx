"use client";

import { MarketRouteSuspense } from "@/components/market";
import MarketStandaloneBusinessPage from "@/components/market/MarketStandaloneBusinessPage";
import { useWorkspaceContextWorkbenchGuard } from "@/lib/header/useWorkspaceContextWorkbenchGuard";

function MarketAcquisitionPageInner() {
  useWorkspaceContextWorkbenchGuard();
  return <MarketStandaloneBusinessPage variant="acquisition" />;
}

export default function MarketAcquisitionPage() {
  return (
    <MarketRouteSuspense>
      <MarketAcquisitionPageInner />
    </MarketRouteSuspense>
  );
}
