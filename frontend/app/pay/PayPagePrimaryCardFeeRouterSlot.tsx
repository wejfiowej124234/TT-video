"use client";

import FeeRouterWiringNotice from "@/components/escrow/FeeRouterWiringNotice";
import type { PayPageViewModel } from "./usePayPage";

export function PayPagePrimaryCardFeeRouterSlot({ vm }: { vm: PayPageViewModel }) {
  const { escrowHref, mayOnchainDeposit } = vm;
  if (!escrowHref || !mayOnchainDeposit) return null;
  return (
    <div className="mt-6">
      <FeeRouterWiringNotice variant="experience" />
    </div>
  );
}
