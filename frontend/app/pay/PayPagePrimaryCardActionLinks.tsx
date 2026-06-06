"use client";

import Link from "next/link";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import {
  payHubPrimaryCtaClass,
  payHubSecondaryCtaClass,
} from "@/lib/pay/payHubL5";
import type { PayPageViewModel } from "./usePayPage";

export function PayPagePrimaryCardActionLinks({ vm }: { vm: PayPageViewModel }) {
  const { t, emphasizeEscrowHub, escrowHref, stashEscrowNavPrefetch } = vm;
  const primaryClass = `${touchTargetLink44Classes} inline-flex justify-center items-center ${payHubPrimaryCtaClass}`;
  const secondaryClass = `${touchTargetLink44Classes} inline-flex justify-center items-center ${payHubSecondaryCtaClass}`;
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      {emphasizeEscrowHub && escrowHref ? (
        <>
          <Link href={escrowHref} onClick={stashEscrowNavPrefetch} className={primaryClass}>
            {t("pay_ctaEscrowPrimary")}
          </Link>
          <Link href="/orders" className={secondaryClass}>
            {t("pay_ctaOrders")}
          </Link>
        </>
      ) : (
        <>
          <Link href="/orders" className={primaryClass}>
            {t("pay_ctaOrders")}
          </Link>
          {escrowHref ? (
            <Link href={escrowHref} onClick={stashEscrowNavPrefetch} className={secondaryClass}>
              {t("pay_ctaEscrow")}
            </Link>
          ) : null}
        </>
      )}
    </div>
  );
}
