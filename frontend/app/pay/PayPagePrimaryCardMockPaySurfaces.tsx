"use client";

import Link from "next/link";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import {
  payHubMockPanelClass,
  payHubMetaClass,
  payHubPrimaryCtaClass,
  payHubSecondaryCtaClass,
} from "@/lib/pay/payHubL5";
import type { PayPageViewModel } from "./usePayPage";

export function PayPagePrimaryCardMockPaySurfaces({ vm }: { vm: PayPageViewModel }) {
  const {
    t,
    escrowHref,
    stashEscrowNavPrefetch,
    showMockPayDisabledExplainer,
    showMockPayCta,
    mockPayOk,
    mockPayBusy,
    mockPayError,
    protocolPaused,
    onMockPayClick,
  } = vm;

  return (
    <>
      {showMockPayDisabledExplainer && escrowHref && !showMockPayCta ? (
        <div
          className="mt-6 rounded-[var(--radius-md)] border border-warning/40 bg-warning/15 p-4 sm:p-5"
          role="status"
          data-tt-pay-surface="mock_pay_disabled_explainer"
        >
          <p className={`${payHubMetaClass} text-amber-100/95`}>{t("pay_mockPay_disabledNotice")}</p>
          <div className="mt-3">
            <Link
              href={escrowHref}
              onClick={stashEscrowNavPrefetch}
              className={`${touchTargetLink44Classes} ${payHubPrimaryCtaClass}`}
            >
              {t("pay_ctaEscrow")}
            </Link>
          </div>
        </div>
      ) : null}

      {(showMockPayCta || mockPayOk) && escrowHref ? (
        <div className={`mt-6 ${payHubMockPanelClass}`} data-tt-pay-surface="mock_pay_cta">
          {showMockPayCta ? (
            <>
              <p className={`mt-2 ${payHubMetaClass}`}>{t("pay_mockPay_hint")}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  data-tt-pay-mock-pay-submit="1"
                  aria-busy={mockPayBusy ? true : undefined}
                  disabled={mockPayBusy || protocolPaused}
                  title={protocolPaused ? t("escrow_protocolPause_title") : undefined}
                  onClick={onMockPayClick}
                  className={`${touchTargetLink44Classes} ${payHubSecondaryCtaClass} px-4 py-2.5 font-semibold disabled:opacity-50`}
                >
                  {mockPayBusy ? t("common_loading") : t("pay_mockPay_cta")}
                </button>
                <Link
                  href={escrowHref}
                  onClick={stashEscrowNavPrefetch}
                  className={`${touchTargetLink44Classes} ${payHubPrimaryCtaClass}`}
                >
                  {t("pay_ctaEscrow")}
                </Link>
              </div>
            </>
          ) : null}
          {mockPayError ? (
            <div className="mt-3">
              <ApiErrorAlert message={mockPayError} tone="dark" />
            </div>
          ) : null}
          {mockPayOk ? (
            <p className="mt-3 text-small text-success" role="status" data-tt-pay-mock-pay-ok="1">
              {t("pay_mockPay_ok")}
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
