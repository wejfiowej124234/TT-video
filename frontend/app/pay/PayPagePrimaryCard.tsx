"use client";

import type { PayPageViewModel } from "./usePayPage";
import { PayPagePrimaryCardActionLinks } from "./PayPagePrimaryCardActionLinks";
import { PayPagePrimaryCardDeadlinePanel } from "./PayPagePrimaryCardDeadlinePanel";
import { PayPagePrimaryCardEscrowCallout } from "./PayPagePrimaryCardEscrowCallout";
import { PayPagePrimaryCardFeeRouterSlot } from "./PayPagePrimaryCardFeeRouterSlot";
import { PayPagePrimaryCardMockPaySurfaces } from "./PayPagePrimaryCardMockPaySurfaces";
import { PayPagePrimaryCardOrderIdSection } from "./PayPagePrimaryCardOrderIdSection";
import { PayPagePrimaryCardOrderLoadError } from "./PayPagePrimaryCardOrderLoadError";
import { PayPagePrimaryCardStepsList } from "./PayPagePrimaryCardStepsList";
import { TT_PAY_HUB_CARD } from "@/lib/pay/payHubL5";

export function PayPagePrimaryCard({ vm }: { vm: PayPageViewModel }) {
  const { t, payStepsHeadingId } = vm;
  return (
    <section className={TT_PAY_HUB_CARD} aria-labelledby={payStepsHeadingId}>
      <h2 id={payStepsHeadingId} className="sr-only">
        {t("pay_pageTitle")}
      </h2>

      <PayPagePrimaryCardEscrowCallout vm={vm} />
      <PayPagePrimaryCardStepsList vm={vm} />
      <PayPagePrimaryCardActionLinks vm={vm} />
      <PayPagePrimaryCardOrderIdSection vm={vm} />
      <PayPagePrimaryCardOrderLoadError vm={vm} />
      <PayPagePrimaryCardDeadlinePanel vm={vm} />
      <PayPagePrimaryCardFeeRouterSlot vm={vm} />
      <PayPagePrimaryCardMockPaySurfaces vm={vm} />
    </section>
  );
}
