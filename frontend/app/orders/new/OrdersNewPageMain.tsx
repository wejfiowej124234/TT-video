"use client";

import Link from "next/link";

import ApiErrorAlert from "@/components/ApiErrorAlert";
import { useTranslation } from "@/components/LocaleProvider";
import OrderFlowSteps from "@/components/escrow/OrderFlowSteps";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { marketHrefForPickGuide } from "@/lib/ordersGuideDeepLink";
import { ordersListHrefAfterCreate } from "@/lib/ordersExpectOrderParam";
import { ordersNewL5MainDataAttrs, TT_ORDERS_NEW_L5 } from "@/lib/orders/ordersNewL5";
import { OrdersNewGuideSummary } from "./OrdersNewGuideSummary";
import { OrdersNewPageFooter } from "./OrdersNewPageFooter";
import type { UseOrdersNewPageResult } from "./useOrdersNewPage";

function OrdersNewCrossNav({ className }: { className?: string }) {
  return (
    <ProductCrossNav
      ariaLabelKey="orders_new_relatedNav_aria"
      showGuides
      className={className ?? TT_ORDERS_NEW_L5.crossNav}
      linkClassName={TT_ORDERS_NEW_L5.crossNavLink}
      separatorClassName={TT_ORDERS_NEW_L5.crossNavSeparator}
    />
  );
}

export function OrdersNewPageMain(vm: UseOrdersNewPageResult) {
  const { t } = useTranslation();
  const marketPickHref = marketHrefForPickGuide();

  const {
    guideIdFromQuery,
    tripStartFromQuery,
    tripEndFromQuery,
    guideId,
    amount,
    setAmount,
    currency,
    setCurrency,
    guides,
    scheduleBlocked,
    scheduleBlockMessage,
    loading,
    error,
    createdId,
    handleSubmit,
    stashCreatedOrderEscrowPayPrefetch,
  } = vm;

  const hasSelectedGuide = guideId.trim().length > 0;
  const guideRow = guides.find((g) => g.id === guideId) ?? { id: guideId };
  const canSubmit = hasSelectedGuide && !scheduleBlocked;

  if (createdId) {
    return (
      <main
        className={TT_ORDERS_NEW_L5.createdShell}
        aria-label={t("orders_created")}
        {...ordersNewL5MainDataAttrs()}
      >
        <div className={TT_ORDERS_NEW_L5.pageVignette} aria-hidden />
        <div className={TT_ORDERS_NEW_L5.ambient} aria-hidden />
        <div className={TT_ORDERS_NEW_L5.dotGrid} aria-hidden />
        <div className={`relative z-[1] ${TT_ORDERS_NEW_L5.successPanel}`}>
          <h1 className="sr-only">{t("orders_created")}</h1>
          <p className={TT_ORDERS_NEW_L5.successTitle}>{t("orders_created")}</p>
          <p className="mt-3">
            <Link href={ordersListHrefAfterCreate(createdId)} className={TT_ORDERS_NEW_L5.successPrimaryBtn}>
              {t("orders_afterCreate_goOrders")}
            </Link>
          </p>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <Link
              href={`/escrow/${encodeURIComponent(createdId)}`}
              onClick={stashCreatedOrderEscrowPayPrefetch}
              className={TT_ORDERS_NEW_L5.successSecondaryLink}
            >
              {t("orders_viewDetail")}
            </Link>
            <Link
              href={`/pay?orderId=${encodeURIComponent(createdId)}`}
              onClick={stashCreatedOrderEscrowPayPrefetch}
              className={TT_ORDERS_NEW_L5.successSecondaryLink}
            >
              {t("orders_payHub")}
            </Link>
          </p>
          <OrdersNewCrossNav />
        </div>
      </main>
    );
  }

  return (
    <main className={TT_ORDERS_NEW_L5.pageShell} aria-label={t("orders_createTitle")} {...ordersNewL5MainDataAttrs()}>
      <div className={TT_ORDERS_NEW_L5.pageVignette} aria-hidden />
      <div className={TT_ORDERS_NEW_L5.ambient} aria-hidden />
      <div className={TT_ORDERS_NEW_L5.dotGrid} aria-hidden />
      <section className={TT_ORDERS_NEW_L5.pageInner}>
        <div className={TT_ORDERS_NEW_L5.formFrame}>
          <div className={`relative ${TT_ORDERS_NEW_L5.formInner}`}>
            <div className={TT_ORDERS_NEW_L5.formInnerGlow} aria-hidden />
            <OrderFlowSteps currentStep={1} variant="experience" compact draftJourneyStep={1} />
            <h1 className={TT_ORDERS_NEW_L5.title}>{t("orders_createTitle")}</h1>
            <form onSubmit={handleSubmit} className="space-y-3" aria-busy={loading ? true : undefined}>
              <div>
                {hasSelectedGuide ? (
                  <section className={`mb-4 ${TT_ORDERS_NEW_L5.guideBanner}`} aria-label={t("orders_selected_guide_region")}>
                    {guideIdFromQuery.trim() ? (
                      <p className={TT_ORDERS_NEW_L5.metaText}>{t("orders_preselected_guide_banner")}</p>
                    ) : null}
                    <OrdersNewGuideSummary
                      guide={guideRow}
                      tripStart={tripStartFromQuery}
                      tripEnd={tripEndFromQuery}
                    />
                    <p className={`${TT_ORDERS_NEW_L5.mutedText} mt-2`}>{t("orders_change_guide_market_hint")}</p>
                    <p className="mt-2">
                      <Link href={marketPickHref} className={TT_ORDERS_NEW_L5.inlineLink}>
                        {t("orders_change_guide")}
                      </Link>
                    </p>
                    {scheduleBlockMessage ? (
                      <p
                        className={`mt-2 text-small ${scheduleBlocked ? "text-rose-200/95" : "text-slate-400"}`}
                        role={scheduleBlocked ? "alert" : "status"}
                      >
                        {scheduleBlockMessage}
                      </p>
                    ) : null}
                  </section>
                ) : (
                  <section className={`mb-4 ${TT_ORDERS_NEW_L5.guideBanner}`} aria-label={t("orders_guides")}>
                    <p className={TT_ORDERS_NEW_L5.metaText}>{t("orders_pick_guide_at_market_body")}</p>
                    <p className="mt-3">
                      <Link href={marketPickHref} className={TT_ORDERS_NEW_L5.marketPickGuideBtn}>
                        {t("orders_pick_guide_at_market")}
                      </Link>
                    </p>
                  </section>
                )}
              </div>
              <div>
                <label htmlFor="orders-new-amount" className={TT_ORDERS_NEW_L5.labelText}>
                  {t("orders_amount")}
                </label>
                <input
                  id="orders-new-amount"
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  disabled={loading || !canSubmit}
                  className={TT_ORDERS_NEW_L5.formField}
                  placeholder={t("orders_amountPlaceholder")}
                  autoComplete="off"
                />
              </div>
              <div>
                <label htmlFor="orders-new-currency" className={TT_ORDERS_NEW_L5.labelText}>
                  {t("orders_currency")}
                </label>
                <input
                  id="orders-new-currency"
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  disabled={loading || !canSubmit}
                  className={TT_ORDERS_NEW_L5.formField}
                  placeholder={t("orders_currencyPlaceholder")}
                  autoComplete="off"
                />
              </div>
              {error ? <ApiErrorAlert message={error} tone="dark" /> : null}
              <button
                type="submit"
                disabled={loading || !canSubmit}
                aria-busy={loading}
                className={TT_ORDERS_NEW_L5.submitBtn}
              >
                {loading ? t("orders_creating") : t("orders_create")}
              </button>
            </form>
          </div>
        </div>
        <OrdersNewPageFooter />
      </section>
    </main>
  );
}
