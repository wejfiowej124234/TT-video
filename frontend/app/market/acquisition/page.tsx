"use client";

import { MarketRouteSuspense } from "@/components/market";
import MarketStandaloneBusinessPage from "@/components/market/MarketStandaloneBusinessPage";

export default function MarketAcquisitionPage() {
  return (
    <MarketRouteSuspense>
      <MarketStandaloneBusinessPage variant="acquisition" />
    </MarketRouteSuspense>
  );
}
