"use client";

import Link from "next/link";
import { useId } from "react";

import ApiErrorAlert from "@/components/ApiErrorAlert";
import { useTranslation } from "@/components/LocaleProvider";
import OrderFlowSteps from "@/components/escrow/OrderFlowSteps";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { ordersListHrefAfterCreate } from "@/lib/ordersExpectOrderParam";
import { ordersNewL5MainDataAttrs, TT_ORDERS_NEW_L5 } from "@/lib/orders/ordersNewL5";
import { ordersNewGuideOptionLabel } from "./ordersNewPageModel";
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
  const formBaseId = useId();
  const guideFieldId = `${formBaseId}-guide`;
  const amountFieldId = `${formBaseId}-amount`;
  const currencyFieldId = `${formBaseId}-currency`;

  const {
    guideIdFromQuery,
    guideId,
    setGuideId,
    amount,
    setAmount,
    currency,
    setCurrency,
    guides,
    guidesLoadError,
    bumpGuidesRetry,
    guidePickerOpen,
    setGuidePickerOpen,
    loading,
    error,
    createdId,
    handleSubmit,
    stashCreatedOrderEscrowPayPrefetch,
    keepLinkGuide,
  } = vm;

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
            <OrderFlowSteps currentStep={1} variant="experience" />
            <h1 className={TT_ORDERS_NEW_L5.title}>{t("orders_createTitle")}</h1>
            {guidesLoadError ? (
              <div className="mb-4 space-y-2">
                <ApiErrorAlert message={guidesLoadError} tone="dark" />
                <form
                  className="inline"
                  onSubmit={(e) => {
                    e.preventDefault();
                    bumpGuidesRetry();
                  }}
                >
                  <button type="submit" className={TT_ORDERS_NEW_L5.retryBtn}>
                    {t("common_retry")}
                  </button>
                </form>
              </div>
            ) : null}
            <form onSubmit={handleSubmit} className="space-y-3" aria-busy={loading ? true : undefined}>
              <div>
                {guideIdFromQuery.trim() ? (
                  <section className={`mb-4 ${TT_ORDERS_NEW_L5.guideBanner}`} aria-label={t("orders_selected_guide_region")}>
                    <p className={TT_ORDERS_NEW_L5.metaText}>{t("orders_preselected_guide_banner")}</p>
                    <p className={TT_ORDERS_NEW_L5.guideBannerTitle}>
                      {ordersNewGuideOptionLabel(guides.find((g) => g.id === guideId) ?? { id: guideId })}
                    </p>
                    {!guidePickerOpen ? (
                      <button type="button" onClick={() => setGuidePickerOpen(true)} className={TT_ORDERS_NEW_L5.inlineLink}>
                        {t("orders_change_guide")}
                      </button>
                    ) : (
                      <div className={TT_ORDERS_NEW_L5.guidePickerDivider}>
                        <label htmlFor={guideFieldId} className={TT_ORDERS_NEW_L5.labelText}>
                          {t("orders_guides")} *
                        </label>
                        <select
                          id={guideFieldId}
                          value={guideId}
                          onChange={(e) => setGuideId(e.target.value)}
                          required
                          disabled={loading}
                          className={TT_ORDERS_NEW_L5.formSelect}
                        >
                          <option value="">{t("orders_selectGuide")}</option>
                          {guides.map((g) => (
                            <option key={g.id} value={g.id}>
                              {ordersNewGuideOptionLabel(g)}
                            </option>
                          ))}
                        </select>
                        <button type="button" onClick={keepLinkGuide} className={TT_ORDERS_NEW_L5.keepLinkGuideBtn}>
                          {t("orders_keep_link_guide")}
                        </button>
                      </div>
                    )}
                  </section>
                ) : (
                  <>
                    <label htmlFor={guideFieldId} className={TT_ORDERS_NEW_L5.labelText}>
                      {t("orders_guides")} *
                    </label>
                    <select
                      id={guideFieldId}
                      value={guideId}
                      onChange={(e) => setGuideId(e.target.value)}
                      required
                      disabled={loading}
                      className={TT_ORDERS_NEW_L5.formSelect}
                    >
                      <option value="">{t("orders_selectGuide")}</option>
                      {guides.map((g) => (
                        <option key={g.id} value={g.id}>
                          {ordersNewGuideOptionLabel(g)}
                        </option>
                      ))}
                    </select>
                    {guidesLoadError == null && guides.length === 0 ? (
                      <p className={`${TT_ORDERS_NEW_L5.mutedText} mt-0.5`}>
                        {t("orders_noGuidesBefore")}
                        <Link href="/guide/register" className={TT_ORDERS_NEW_L5.inlineLink}>
                          {t("orders_noGuidesLink")}
                        </Link>
                        {t("orders_noGuidesAfter")}
                      </p>
                    ) : null}
                  </>
                )}
              </div>
              <div>
                <label htmlFor={amountFieldId} className={TT_ORDERS_NEW_L5.labelText}>
                  {t("orders_amount")}
                </label>
                <input
                  id={amountFieldId}
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  disabled={loading}
                  className={TT_ORDERS_NEW_L5.formField}
                  placeholder={t("orders_amountPlaceholder")}
                  autoComplete="off"
                />
              </div>
              <div>
                <label htmlFor={currencyFieldId} className={TT_ORDERS_NEW_L5.labelText}>
                  {t("orders_currency")}
                </label>
                <input
                  id={currencyFieldId}
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  disabled={loading}
                  className={TT_ORDERS_NEW_L5.formField}
                  placeholder={t("orders_currencyPlaceholder")}
                  autoComplete="off"
                />
              </div>
              {error ? <ApiErrorAlert message={error} tone="dark" /> : null}
              <button type="submit" disabled={loading} aria-busy={loading} className={TT_ORDERS_NEW_L5.submitBtn}>
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
