"use client";

import { useId, useMemo } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useItineraryForm } from "./useItineraryForm";
import { defaultForm } from "./types";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import { CITY_TRANSPORT_OPTIONS, CITY_TRANSPORT_DETAILS, getGuideLevelsWithPricing } from "./constants";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import DetailOverlay from "./DetailOverlay";
import TouristForm from "./sections/TouristForm";
import GuideForm from "./sections/GuideForm";

export type { TransportType, CityTransportType, GuideLevel, DayPlan } from "./types";

/** 自由市场：自定义行程弹窗。49 A：提交走 POST /itineraries/custom，成功后 onSuccess(orderId) 刷新列表。 */
export default function CustomItineraryModal({
  open,
  onClose,
  onSuccess,
  preselectedGuideId,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (orderId: string) => void;
  /** 例如 `/market?guide_id=` 深链，与 POST /itineraries 预选向导语义一致 */
  preselectedGuideId?: string;
}) {
  const { t } = useTranslation();
  const bag = useItineraryForm({ open, onClose, onSuccess, preselectedGuideId });
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

  const pillSelected =
    "inline-flex min-h-[44px] items-center justify-center rounded-full px-3 py-1.5 text-meta font-medium border transition-colors bg-white/30 border-white/40 text-white";
  const pillUnselected =
    "inline-flex min-h-[44px] items-center justify-center rounded-full px-3 py-1.5 text-meta font-medium border transition-colors bg-white/10 border-white/20 text-white/80 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50";

  const guideLevelsWithPricing = useMemo(
    () => getGuideLevelsWithPricing(form.country || DEFAULT_COUNTRY),
    [form.country]
  );

  const trapRef = useFocusTrap(open, bag.requestClose);
  const modalTitleId = useId();
  const modalDescId = useId();
  const submitErrorNoticeId = useId();
  const mainFormId = useId();

  if (!open) return null;

  const setDialogRef = (el: HTMLDivElement | null) => {
    (bag.dialogRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    (trapRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
  };

  const labelClass = "block text-small font-medium text-white mb-1";
  const inputClass =
    "w-full rounded-[var(--radius-sm)] border border-white/25 bg-white/5 px-3 py-2 text-small text-white placeholder-white/50 focus:outline-none focus-visible:border-travel-400 focus-visible:ring-2 focus-visible:ring-travel-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 backdrop-blur-sm";
  const descClass = "text-small text-white/90 mt-0.5 drop-shadow-market-pill";
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={modalTitleId}
      aria-describedby={
        submitError ? `${modalDescId} ${submitErrorNoticeId}` : modalDescId
      }
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden onClick={onClose} />
      <div
        ref={setDialogRef}
        className="relative w-full max-w-2xl rounded-[var(--radius-lg)] border border-white/25 bg-white/5 backdrop-blur-md shadow-strong overflow-hidden max-h-[90vh] flex flex-col"
        tabIndex={-1}
      >
        <div className="border-b border-white/15 px-4 py-3 sm:px-6 shrink-0 bg-transparent">
          <h2
            id={modalTitleId}
            className="text-body-l font-semibold text-white drop-shadow-market-body"
          >
            {t("market_customItineraryTitle")}
          </h2>
          <p id={modalDescId} className={descClass}>
            {t("market_customItineraryDesc")}
          </p>
        </div>
        <form id={mainFormId} onSubmit={handleSubmit} hidden aria-hidden="true" />
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto bg-transparent">
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
                  onChange={() => setForm(() => ({ ...defaultForm(5), creatorType: "tourist" }))}
                  className="rounded-full border-white/25 text-travel-500 bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-travel-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                />
                <span className="text-small text-white">{t("market_createAsTourist")}</span>
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
                  className="rounded-full border-white/25 text-travel-500 bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-travel-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                />
                <span className="text-small text-white">{t("market_createAsGuide")}</span>
              </label>
            </div>
          </div>

          {form.creatorType === "tourist" && <TouristForm {...touristProps} />}
          {form.creatorType === "guide" && <GuideForm {...guideProps} />}
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

        <div className="flex flex-wrap gap-2 px-4 sm:px-6 pb-4 sm:pb-6 pt-2 border-t border-white/15 shrink-0 bg-transparent">
          <button
            type="submit"
            form={mainFormId}
            disabled={submitting}
            aria-busy={submitting ? true : undefined}
            className={`${touchTargetLink44Classes} btn-console rounded-[var(--radius-sm)] bg-cta-gradient px-4 py-2 text-smallall font-medium text-white hover:brightness-110 motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-white/20 disabled:opacity-60 disabled:pointer-events-none`}
          >
            {submitting ? t("market_confirmCreating") : t("market_confirmCreate")}
          </button>
          <form
            className="inline"
            onSubmit={(e) => {
              e.preventDefault();
              onClose();
            }}
          >
            <button
              type="submit"
              disabled={submitting}
              aria-busy={submitting ? true : undefined}
              className={`${touchTargetLink44Classes} btn-console rounded-[var(--radius-sm)] border border-white/40 px-4 py-2 text-smallall text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-travel-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white/20 disabled:opacity-60`}
            >
              {t("common_cancel")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
