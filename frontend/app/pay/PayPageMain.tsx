"use client";

import OrderFlowSteps from "@/components/escrow/OrderFlowSteps";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import {
  payHubBodyClass,
  payHubCalloutTitleClass,
  payHubFooterLinkClass,
  payHubMetaClass,
  payHubTitleClass,
  TT_PAY_HUB_INNER,
  TT_PAY_HUB_PAGE_SHELL,
  TT_PAY_HUB_SUMMARY_PANEL,
  TT_PAY_HUB_ZONE,
  payHubL5MainDataAttrs,
} from "@/lib/pay/payHubL5";
import { PAY_ORDER_ID_UUID_RE } from "@/lib/payOrderIdSource";

import { PayPageOrdersBreadcrumb } from "./PayPageOrdersBreadcrumb";
import { PayPagePrimaryCard } from "./PayPagePrimaryCard";
import type { PayPageViewModel } from "./usePayPage";

export function PayPageMain({ vm }: { vm: PayPageViewModel }) {
  const {
    t,
    awaitingOrderSlice,
    payMockPayAuditSurface,
    orderFetchPhase,
    payPageSubtitle,
    orderLoadedOk,
    orderRow,
    payOrderForbidden,
    payOrderSummaryHeadingId,
    payFlowBandAria,
    payOrderFlowStep,
    payFlowContextText,
    effectiveOrderId,
  } = vm;

  const showBreadcrumb = PAY_ORDER_ID_UUID_RE.test(effectiveOrderId);

  return (
    <main
      className={TT_PAY_HUB_PAGE_SHELL}
      aria-label={t("pay_pageTitle")}
      aria-busy={awaitingOrderSlice ? true : undefined}
      data-tt-pay-root="1"
      data-tt-pay-mock-ui={payMockPayAuditSurface}
      data-tt-pay-order-fetch-phase={orderFetchPhase}
      {...payHubL5MainDataAttrs()}
    >
      <div className={TT_PAY_HUB_INNER}>
        <div data-zone="order-protocol" className={TT_PAY_HUB_ZONE}>
          {showBreadcrumb ? <PayPageOrdersBreadcrumb /> : null}
          <header className="mb-6">
            <h1 className={payHubTitleClass}>{t("pay_pageTitle")}</h1>
            <p className={`mt-3 ${payHubBodyClass}`}>{payPageSubtitle}</p>
          </header>

          {orderLoadedOk && orderRow && !payOrderForbidden ? (
            <section
              className={`mb-6 ${TT_PAY_HUB_SUMMARY_PANEL}`}
              aria-labelledby={payOrderSummaryHeadingId}
            >
              <h2 id={payOrderSummaryHeadingId} className="sr-only">
                {t("pay_orderSummary_title")}
              </h2>
              <div className={payHubCalloutTitleClass}>{t("pay_orderSummary_title")}</div>
              <p className={`mt-3 ${payHubMetaClass}`}>{t("pay_orderSummary_idLabel")}</p>
              <p className="font-mono text-body text-slate-100 break-all">{orderRow.id}</p>
              <p className={`mt-3 ${payHubMetaClass}`}>{t("pay_orderSummary_amountLabel")}</p>
              <p className="text-body font-medium text-ref-sun/95">
                {orderRow.amount ?? t("ui_em_dash")}
                {orderRow.currency ? ` ${orderRow.currency}` : ""}
              </p>
            </section>
          ) : null}

          <div className="mb-6" aria-label={payFlowBandAria}>
            <OrderFlowSteps currentStep={payOrderFlowStep} variant="experience" compact />
            <p className={`mt-3 ${payHubMetaClass}`} role="status">
              {payFlowContextText}
            </p>
          </div>

          <PayPagePrimaryCard vm={vm} />

          <p className={`mt-6 ${payHubMetaClass}`} role="note" data-tt-pay-surface="pay_disclaimer">
            {t("pay_disclaimer")}
          </p>

          <ProductCrossNav
            ariaLabelKey="pay_relatedNav_aria"
            showGuides
            className={`mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-slate-400`}
            linkClassName={`inline-flex min-h-[44px] items-center justify-center ${payHubFooterLinkClass}`}
            separatorClassName="text-slate-500"
          />
        </div>
      </div>
    </main>
  );
}
