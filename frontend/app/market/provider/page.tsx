"use client";

import { MarketRouteSuspense } from "@/components/market";
import MarketStandaloneBusinessPage from "@/components/market/MarketStandaloneBusinessPage";

export default function MarketProviderPage() {
  return (
    <MarketRouteSuspense>
      <MarketStandaloneBusinessPage variant="provider" />
    </MarketRouteSuspense>
  );
}
