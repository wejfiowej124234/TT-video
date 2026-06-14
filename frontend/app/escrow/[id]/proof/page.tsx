"use client";

import { Suspense } from "react";
import { EscrowRateRouteSuspense } from "@/components/escrow/EscrowRateRouteSuspense";
import { TT_ESCROW_PROTOCOL_PAGE_SHELL } from "@/lib/escrowProtocolUi";
import { EscrowProofPageInner } from "./EscrowProofPageInner";

export default function EscrowProofPage() {
  return (
    <div className={TT_ESCROW_PROTOCOL_PAGE_SHELL}>
      <div className="container py-8 md:py-12 max-w-5xl">
        <EscrowRateRouteSuspense>
          <Suspense fallback={null}>
            <EscrowProofPageInner />
          </Suspense>
        </EscrowRateRouteSuspense>
      </div>
    </div>
  );
}
