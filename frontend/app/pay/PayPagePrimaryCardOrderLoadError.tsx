"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import {
  payHubForbiddenPanelClass,
  payHubLinkClass,
  payHubMetaClass,
  payHubPrimaryCtaClass,
  payHubSecondaryCtaClass,
} from "@/lib/pay/payHubL5";
import type { PayPageViewModel } from "./usePayPage";

export function PayPagePrimaryCardOrderLoadError({ vm }: { vm: PayPageViewModel }) {
  const {
    t,
    orderLoadError,
    escrowHref,
    payOrderForbidden,
    payLoginReturnPath,
    onRetryOrderFetch,
  } = vm;
  if (!orderLoadError || !escrowHref) return null;
  return (
    <div className="mt-4 space-y-2" data-tt-pay-order-load-error="1">
      {payOrderForbidden ? (
        <div className={payHubForbiddenPanelClass} role="status" aria-live="polite">
          <p className={`text-small font-medium text-ref-sun/95`}>{t("pay_orderForbidden_title")}</p>
          <p className={`mt-2 ${payHubMetaClass}`}>{orderLoadError}</p>
          <Link
            href="/orders"
            data-tt-pay-order-forbidden-cta-orders="1"
            className={`${touchTargetLink44Classes} mt-4 inline-flex min-h-[44px] items-center justify-center ${payHubPrimaryCtaClass}`}
          >
            {t("pay_orderForbidden_ctaOrders")}
          </Link>
        </div>
      ) : (
        <>
          <ApiErrorAlert message={orderLoadError} tone="dark" />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {orderLoadError === t("order_error_login_required") ? (
              <Link
                href={`/auth/login?returnUrl=${encodeURIComponent(payLoginReturnPath)}`}
                className={`${touchTargetLink44Classes} ${payHubLinkClass} underline underline-offset-2 font-medium text-small`}
              >
                {t("orders_goLogin")}
              </Link>
            ) : null}
            <form
              className="inline"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                onRetryOrderFetch();
              }}
            >
              <button
                type="submit"
                data-tt-pay-order-fetch-retry="1"
                aria-label={t("common_retry")}
                className={`${touchTargetLink44Classes} ${payHubSecondaryCtaClass} px-3 py-2`}
              >
                {t("common_retry")}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
