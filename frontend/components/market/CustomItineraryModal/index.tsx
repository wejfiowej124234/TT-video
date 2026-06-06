"use client";

import { useEffect, useId, useMemo } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useItineraryForm } from "./useItineraryForm";
import { defaultForm } from "./types";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import { CITY_TRANSPORT_OPTIONS, CITY_TRANSPORT_DETAILS, getGuideLevelsWithPricing } from "./constants";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { TT_MARKETING_BTN_MARKET_PRIMARY, TT_MARKETING_MARKET_DARK_PATH, TT_MARKETING_MARKET_GLASS_CHOICE_CONTROL } from "@/lib/marketingUi";
import MarketDetailDrawerFrame from "@/components/market/MarketDetailDrawerFrame";
import {
  marketDetailDrawerCloseBtn,
  marketDetailDrawerFooterSticky,
  marketDetailDrawerHeaderRow,
  marketDetailDrawerInnerCol,
  marketDetailDrawerScrollBody,
  marketDetailDrawerScrollRegion,
  marketDetailDrawerTitle,
} from "@/components/market/marketDetailDrawerClasses";
import DetailOverlay from "./DetailOverlay";
import TouristForm from "./sections/TouristForm";
import GuideForm from "./sections/GuideForm";

export type { TransportType, CityTransportType, GuideLevel, DayPlan } from "./types";

/** 自由市场：自定义行程右侧抽屉（与订单详情同 z 层，高于顶栏）。 */
export default function CustomItineraryModal({
  open,
  onClose,
  onSuccess,
  preselectedGuideId,
  initialTotalDays,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (orderId: string) => void;
  /** 例如 `/market?guide_id=` 深链，与 POST /itineraries 预选向导语义一致 */
  preselectedGuideId?: string;
  /** 打开时预选总天数（英雄区快捷 1/3/5/7 天） */
  initialTotalDays?: number;
}) {
  const { t } = useTranslation();
  const bag = useItineraryForm({ open, onClose, onSuccess, preselectedGuideId, initialTotalDays });
  const {
    form,
    setForm,
    submitError,
    submitting,
    viewingAttraction,
    setViewingAttraction,
    viewingFood,
    setViewingFood,
    viewingVehicle,
    setViewingVehicle,
    viewingHotel,
    setViewingHotel,
    viewingGuideImage,
    setViewingGuideImage,
    accountAvatarUrl,
    coverFileTooBig,
    setCoverFileTooBig,
    submitErrorRef,
    dialogRef,
    attractionOverlayRef,
    userHasEditedBudgetRef,
    guideHasEditedAmountRef,
    setTotalDays,
    setDayPlan,
    setGuideDayPlan,
    handleSubmit,
    cities,
    quote,
  } = bag;

  const {
    suggestedCityTransportFee,
    suggestedInterCityFee,
    suggestedTransportFee,
    touristCityTransportLines,
    hasTouristInterCity,
    touristInterCityTransportLines,
    guideDayPlansNormalized,
    hasGuideInterCity,
    suggestedGuideCityTransportFee,
    suggestedGuideInterCityFee,
    guideCityTransportLines,
    guideInterCityTransportLines,
    guideQuoteBreakdown,
    budgetBreakdown,
    budgetSuggestion,
  } = quote;

  const D = TT_MARKETING_MARKET_DARK_PATH;
  const pillSelected = D.customItineraryPillSelected;
  const pillUnselected = D.customItineraryPillIdle;

  const guideLevelsWithPricing = useMemo(
    () => getGuideLevelsWithPricing(form.country || DEFAULT_COUNTRY),
    [form.country]
  );

  const trapRef = useFocusTrap(open, bag.requestClose);
  const modalTitleId = useId();
  const modalDescId = useId();
  const submitErrorNoticeId = useId();
  const mainFormId = useId();

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open) return null;

  const setDialogRef = (el: HTMLDivElement | null) => {
    (bag.dialogRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    (trapRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
  };

  const labelClass = D.studioLabel;
  const inputClass = D.studioInput;
  const descClass = `${D.studioDesc} drop-shadow-market-pill`;
  const styles = { labelClass, inputClass, descClass, pillSelected, pillUnselected };

  const touristProps = {
    ...styles,
    guideLevelsWithPricing,
    form,
    setForm,
    setDayPlan,
    setTotalDays,
    cities,
    budgetBreakdown,
    budgetSuggestion,
    suggestedCityTransportFee,
    suggestedInterCityFee,
    suggestedTransportFee,
    touristCityTransportLines,
    hasTouristInterCity,
    touristInterCityTransportLines,
    setViewingAttraction,
    setViewingFood,
    setViewingVehicle,
    setViewingHotel,
    submitErrorRef,
    submitError,
    submitErrorNoticeId,
    userHasEditedBudgetRef,
    coverFileTooBig,
    setCoverFileTooBig,
    t,
  };

  const guideProps = {
    ...styles,
    guideLevelsWithPricing,
    form,
    setForm,
    setTotalDays,
    setGuideDayPlan,
    cities,
    guideDayPlansNormalized,
    guideQuoteBreakdown,
    suggestedGuideCityTransportFee,
    suggestedGuideInterCityFee,
    hasGuideInterCity,
    guideCityTransportLines,
    guideInterCityTransportLines,
    setViewingGuideImage,
    viewingGuideImage,
    setViewingVehicle,
    setViewingHotel,
    submitErrorRef,
    submitError,
    submitErrorNoticeId,
    guideHasEditedAmountRef,
    accountAvatarUrl,
    coverFileTooBig,
    setCoverFileTooBig,
    t,
  };

  const preserveDays = form.totalDays;

  return (
    <MarketDetailDrawerFrame
      panelVariant="stickyFooter"
      onRequestClose={bag.requestClose}
      panelRef={setDialogRef}
      panelClassName="max-w-lg"
      aria-labelledby={modalTitleId}
      aria-describedby={submitError ? `${modalDescId} ${submitErrorNoticeId}` : modalDescId}
      aria-busy={submitting ? true : undefined}
      rootHtmlProps={{ "data-tt-custom-itinerary-modal": "1" }}
      panelHtmlProps={{ "data-testid": "custom-itinerary-panel" }}
    >
      <div className={marketDetailDrawerInnerCol}>
        <div className={marketDetailDrawerHeaderRow}>
          <div className="min-w-0 flex-1">
            <h2 id={modalTitleId} className={marketDetailDrawerTitle}>
              {t("market_customItineraryTitle")}
            </h2>
            <p id={modalDescId} className={`mt-1 ${descClass}`}>
              {t("market_customItineraryDesc")}
            </p>
          </div>
          <button
            type="button"
            className={marketDetailDrawerCloseBtn}
            onClick={bag.requestClose}
            aria-label={t("common_close")}
          >
            ×
          </button>
        </div>

        <form id={mainFormId} onSubmit={handleSubmit} hidden aria-hidden="true" />

        <div className={marketDetailDrawerScrollRegion}>
          <div className={`${marketDetailDrawerScrollBody} space-y-4`}>
            <div>
              <span className={labelClass}>
                {t("market_createAsTourist")} / {t("market_createAsGuide")}
              </span>
              <div className="flex gap-3 mt-1">
                <label className="flex min-h-[44px] items-center justify-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="creatorType"
                    checked={form.creatorType === "tourist"}
                    onChange={() => setForm(() => ({ ...defaultForm(preserveDays), creatorType: "tourist" }))}
                    className={TT_MARKETING_MARKET_GLASS_CHOICE_CONTROL}
                  />
                  <span className="text-small text-slate-200">{t("market_createAsTourist")}</span>
                </label>
                <label className="flex min-h-[44px] items-center justify-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="creatorType"
                    checked={form.creatorType === "guide"}
                    onChange={() =>
                      setForm((f) => {
                        const base = defaultForm(f.totalDays);
                        return {
                          ...base,
                          creatorType: "guide",
                          country: f.creatorType === "guide" ? f.country : (f.country || ""),
                          destinationManual: f.creatorType === "guide" ? f.destinationManual : "",
                          title: f.creatorType === "guide" ? f.title : "",
                          amount: f.creatorType === "guide" ? f.amount : "",
                          description: f.creatorType === "guide" ? f.description : "",
                          image: f.creatorType === "guide" ? f.image : "",
                          headcount: f.headcount,
                          totalDays: f.totalDays,
                          guideDayPlans: f.creatorType === "guide" ? (f.guideDayPlans ?? base.guideDayPlans) : base.guideDayPlans,
                        };
                      })
                    }
                    className={TT_MARKETING_MARKET_GLASS_CHOICE_CONTROL}
                  />
                  <span className="text-small text-slate-200">{t("market_createAsGuide")}</span>
                </label>
              </div>
            </div>

            {form.creatorType === "tourist" && <TouristForm {...touristProps} />}
            {form.creatorType === "guide" && <GuideForm {...guideProps} />}
          </div>
        </div>

        {viewingAttraction && (
          <DetailOverlay
            image={viewingAttraction.image}
            title={viewingAttraction.label}
            description={viewingAttraction.description}
            onClose={() => setViewingAttraction(null)}
            closeLabel={t("common_close")}
            overlayRef={attractionOverlayRef}
          />
        )}
        {viewingFood && (
          <DetailOverlay
            image={viewingFood.image}
            title={viewingFood.label}
            description={viewingFood.description}
            onClose={() => setViewingFood(null)}
            closeLabel={t("common_close")}
          />
        )}
        {viewingVehicle && (
          <DetailOverlay
            image={CITY_TRANSPORT_DETAILS[viewingVehicle].image}
            title={t(CITY_TRANSPORT_OPTIONS.find((o) => o.value === viewingVehicle)!.labelKey)}
            description={t(CITY_TRANSPORT_DETAILS[viewingVehicle].descriptionKey)}
            onClose={() => setViewingVehicle(null)}
            closeLabel={t("common_close")}
          />
        )}
        {viewingHotel && (
          <DetailOverlay
            image={viewingHotel.image}
            title={viewingHotel.label}
            description={viewingHotel.description}
            onClose={() => setViewingHotel(null)}
            closeLabel={t("common_close")}
          />
        )}

        <div className={`${marketDetailDrawerFooterSticky} flex flex-wrap gap-2`}>
          <button
            type="submit"
            form={mainFormId}
            disabled={submitting}
            aria-busy={submitting ? true : undefined}
            data-testid="custom-itinerary-submit"
            className={`${touchTargetLink44Classes} ${TT_MARKETING_BTN_MARKET_PRIMARY} w-full sm:w-auto disabled:opacity-60 disabled:pointer-events-none`}
          >
            {submitting ? t("market_confirmCreating") : t("market_confirmCreate")}
          </button>
          <button
            type="button"
            disabled={submitting}
            aria-busy={submitting ? true : undefined}
            onClick={onClose}
            className={`${touchTargetLink44Classes} ${D.studioFooterGhost} w-full sm:w-auto disabled:opacity-60`}
          >
            {t("common_cancel")}
          </button>
        </div>
      </div>
    </MarketDetailDrawerFrame>
  );
}
