"use client";

import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import OrderFlowSteps from "@/components/escrow/OrderFlowSteps";
import { ItineraryNewPageAlerts } from "@/components/itinerary/itineraryNewPage/ItineraryNewPageAlerts";
import { ItineraryNewFormBlock } from "@/components/itinerary/itineraryNewPage/ItineraryNewFormBlock";
import { ItineraryNewSuccessBlock } from "@/components/itinerary/itineraryNewPage/ItineraryNewSuccessBlock";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";

import type { UseItineraryNewPageResult } from "./useItineraryNewPage";
import {
  TT_MARKETING_PRODUCT_PAGE_INNER_NARROW,
  TT_MARKETING_PRODUCT_PAGE_SHELL,
} from "@/lib/marketingUi";

export function ItineraryNewPageMain(vm: UseItineraryNewPageResult) {
  const { t } = useTranslation();
  const formBaseId = useId();
  const formErrorId = useId();
  const fid = (name: string) => `${formBaseId}-${name}`;
  const itinDailyHeadingId = useId();
  const itinCostHeadingId = useId();

  const {
    itinNewLoginReturnPath,
    fromOrderId,
    guideIdFromQuery,
    guideQueryOk,
    guideQueryInvalid,
    draftQueryInvalid,
    form,
    submitting,
    error,
    result,
    fromOrderLoading,
    fromOrderPrefetchError,
    fromOrderFullResponse,
    draftHydrateLoading,
    draftHydrateError,
    handleChange,
    onCountryPill,
    onCityPill,
    handleSubmit,
    stashPostCreateEscrowPayPrefetch,
  } = vm;

  return (
    <main
      className={`${TT_MARKETING_PRODUCT_PAGE_SHELL} text-ink-800`}
      aria-label={t("itin_title")}
      data-tt-itinerary-new-page="1"
      data-tt-marketing-product-shell="1"
    >
      <section className={TT_MARKETING_PRODUCT_PAGE_INNER_NARROW}>
      <OrderFlowSteps currentStep={1} />
      <h1 className="text-h3 font-semibold text-ink-900 mt-6">{t("itin_title")}</h1>
      <p className="mt-2 text-body text-ink-600">{t("itin_desc")}</p>

      <ItineraryNewPageAlerts
        t={t}
        guideQueryInvalid={guideQueryInvalid}
        draftQueryInvalid={draftQueryInvalid}
        draftHydrateLoading={draftHydrateLoading}
        draftHydrateError={draftHydrateError}
        guideQueryOk={guideQueryOk}
        guideIdFromQuery={guideIdFromQuery}
        fromOrderId={fromOrderId}
        fromOrderLoading={fromOrderLoading}
        fromOrderPrefetchError={fromOrderPrefetchError}
        fromOrderFullResponse={fromOrderFullResponse}
      />

      <ItineraryNewFormBlock
        t={t}
        form={form}
        submitting={submitting}
        error={error}
        formErrorId={formErrorId}
        itinNewLoginReturnPath={itinNewLoginReturnPath}
        fid={fid}
        onSubmit={handleSubmit}
        onChange={handleChange}
        onCountryPill={onCountryPill}
        onCityPill={onCityPill}
      />

      {result && (
        <ItineraryNewSuccessBlock
          t={t}
          result={result}
          itinDailyHeadingId={itinDailyHeadingId}
          itinCostHeadingId={itinCostHeadingId}
          onStashEscrowPrefetch={stashPostCreateEscrowPayPrefetch}
        />
      )}
      <ProductCrossNav ariaLabelKey="itin_relatedNav_aria" />
      </section>
    </main>
  );
}
