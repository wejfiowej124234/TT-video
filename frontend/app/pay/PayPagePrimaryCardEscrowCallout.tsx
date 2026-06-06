"use client";

import Link from "next/link";
import { orderStateToStatusLabelKey } from "@/lib/orderStatusI18n";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import {
  payHubCalloutBodyClass,
  payHubCalloutClass,
  payHubCalloutTitleClass,
  payHubPrimaryCtaClass,
} from "@/lib/pay/payHubL5";
import type { PayPageViewModel } from "./usePayPage";

export function PayPagePrimaryCardEscrowCallout({ vm }: { vm: PayPageViewModel }) {
  const { t, emphasizeEscrowHub, escrowHref, stashEscrowNavPrefetch, payEscrowPhaseCalloutId, orderRow } = vm;
  if (!emphasizeEscrowHub || !escrowHref) return null;
  return (
    <div
      className={`mb-6 ${payHubCalloutClass}`}
      role="region"
      aria-labelledby={payEscrowPhaseCalloutId}
    >
      <h3 id={payEscrowPhaseCalloutId} className={payHubCalloutTitleClass}>
        {t("pay_escrowPhase_calloutTitle")}
      </h3>
      <p className={`mt-2 ${payHubCalloutBodyClass}`}>
        {orderRow?.escrow_address
          ? t("pay_escrowPhase_bodyWithStatus", {
              status: t(orderStateToStatusLabelKey(orderRow)),
            })
          : t("pay_escrowPhase_bodyNoEscrow")}
      </p>
      <Link
        href={escrowHref}
        onClick={stashEscrowNavPrefetch}
        className={`${touchTargetLink44Classes} mt-4 inline-flex min-h-[44px] items-center justify-center ${payHubPrimaryCtaClass}`}
      >
        {t("pay_ctaEscrowPrimary")}
      </Link>
    </div>
  );
}
