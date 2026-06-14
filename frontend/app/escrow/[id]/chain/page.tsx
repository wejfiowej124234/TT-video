"use client";

import { Suspense } from "react";
import { EscrowRateRouteSuspense } from "@/components/escrow/EscrowRateRouteSuspense";
import { TT_ESCROW_PROTOCOL_PAGE_SHELL } from "@/lib/escrowProtocolUi";
import { EscrowChainPageInner } from "./EscrowChainPageInner";

export default function EscrowChainRecordPage() {
  return (
    <div className={TT_ESCROW_PROTOCOL_PAGE_SHELL}>
      <div className="container py-8 md:py-12 max-w-5xl">
        <EscrowRateRouteSuspense>
          <Suspense fallback={null}>
            <EscrowChainPageInner />
          </Suspense>
        </EscrowRateRouteSuspense>
      </div>
    </div>
  );
}
