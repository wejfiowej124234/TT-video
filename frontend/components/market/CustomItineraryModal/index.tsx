"use client";

import { useCallback, useEffect, useId, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "@/components/LocaleProvider";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useItineraryForm } from "./useItineraryForm";
import { defaultForm } from "./types";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import { CITY_TRANSPORT_OPTIONS, CITY_TRANSPORT_DETAILS, getGuideLevelsWithPricing } from "./constants";
import { touchTargetLink44Classes, travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";
import { TT_MARKETING_BTN_MARKET_PRIMARY, TT_MARKETING_MARKET_DARK_PATH, TT_MARKETING_MARKET_GLASS_CHOICE_CONTROL } from "@/lib/marketingUi";
import MarketGlassModalFrame from "@/components/market/MarketGlassModalFrame";
import DiscardConfirmModal from "@/components/shared/DiscardConfirmModal";
import DetailOverlay from "./DetailOverlay";
import TouristForm from "./sections/TouristForm";
import GuideForm from "./sections/GuideForm";

export type { TransportType, CityTransportType, GuideLevel, DayPlan } from "./types";

/** 自由市场：自定义行程居中玻璃弹窗（与旅行收购 / 商家橱窗创作台同构）。 */
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
    attractionOverlayRef,
    userHasEditedBudgetRef,
    guideHasEditedAmountRef,
    setTotalDays,
    setDayPlan,
    setGuideDayPlan,
    handleSubmit,
    confirmDiscard,
    discardConfirmOpen,
    cancelDiscardConfirm,
    acceptDiscardConfirm,
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
    [form.country],
  );

  const trapRef = useFocusTrap(open, bag.requestClose);
  const modalTitleId = useId();
  const modalDescId = useId();
  const submitErrorNoticeId = useId();
  const mainFormId = useId();
  const stickyErrorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!submitError) return;
    stickyErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [submitError]);

  const switchCreatorType = useCallback(
    (next: "tourist" | "guide") => {
      if (form.creatorType === next) return;
      if (!confirmDiscard()) return;
      const days = form.totalDays;
      if (next === "tourist") {
        setForm(() => ({ ...defaultForm(days), creatorType: "tourist" }));
        return;
      }
      setForm((f) => ({
        ...defaultForm(f.totalDays),
        creatorType: "guide",
        country: f.country || "",
        totalDays: f.totalDays,
        headcount: f.headcount,
      }));
    },
    [confirmDiscard, form.creatorType, form.totalDays, setForm],
  );

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const setDialogRef = (el: HTMLDivElement | null) => {
    (bag.dialogRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    (trapRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
  };

  const labelClass = D.studioLabel;
  const inputClass = D.studioInput;
  const descClass = D.studioDesc;
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

  return createPortal(
    <>
    <MarketGlassModalFrame
      onRequestClose={bag.requestClose}
      panelRef={setDialogRef}
      panelClassName="max-h-[85vh] flex flex-col"
      aria-labelledby={modalTitleId}
      aria-describedby={submitError ? `${modalDescId} ${submitErrorNoticeId}` : modalDescId}
      rootHtmlProps={{ "data-tt-custom-itinerary-modal": "1" }}
      panelHtmlProps={{ "data-testid": "custom-itinerary-panel", tabIndex: -1 }}
    >
      <div className={D.studioModalHeader}>
        <div className="min-w-0 flex-1">
          <h2 id={modalTitleId} className="text-body-l font-semibold text-white drop-shadow-market-body">
            {t("market_customItineraryTitle")}
          </h2>
          <p id={modalDescId} className={descClass}>
            {t("market_customItineraryDesc")}
          </p>
        </div>
        <form
          className="shrink-0"
          onSubmit={(ev) => {
            ev.preventDefault();
            bag.requestClose();
          }}
        >
          <button
            type="submit"
            className={`${touchTargetLink44Classes} ${travelFocusRingCoreOffset2Classes} ${D.studioCloseBtn}`}
            aria-label={t("common_close")}
          >
            ✕
          </button>
        </form>
      </div>

      <form id={mainFormId} onSubmit={handleSubmit} hidden aria-hidden="true" />

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 text-slate-100 sm:p-6">
          {submitError ? (
            <div
              ref={stickyErrorRef}
              id={submitErrorNoticeId}
              className="sticky top-0 z-10 rounded-[var(--radius-sm)] border border-warning/45 bg-warning/20 px-3 py-2 text-small text-white shadow-md backdrop-blur-sm"
              role="alert"
              aria-live="assertive"
            >
              {submitError}
            </div>
          ) : null}

          <div>
            <span className={labelClass}>
              {t("market_createAsTourist")} / {t("market_createAsGuide")}
            </span>
            <div className="mt-1 flex gap-3">
              <label className="flex min-h-[44px] cursor-pointer items-center justify-start gap-2">
                <input
                  type="radio"
                  name="creatorType"
                  checked={form.creatorType === "tourist"}
                  onChange={() => switchCreatorType("tourist")}
                  className={TT_MARKETING_MARKET_GLASS_CHOICE_CONTROL}
                />
                <span className="text-small text-slate-200">{t("market_createAsTourist")}</span>
              </label>
              <label className="flex min-h-[44px] cursor-pointer items-center justify-start gap-2">
                <input
                  type="radio"
                  name="creatorType"
                  checked={form.creatorType === "guide"}
                  onChange={() => switchCreatorType("guide")}
                  className={TT_MARKETING_MARKET_GLASS_CHOICE_CONTROL}
                />
                <span className="text-small text-slate-200">{t("market_createAsGuide")}</span>
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
            escHint={t("market_itinerary_overlay_esc_hint")}
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
            escHint={t("market_itinerary_overlay_esc_hint")}
          />
        )}
        {viewingVehicle && (
          <DetailOverlay
            image={CITY_TRANSPORT_DETAILS[viewingVehicle].image}
            title={t(CITY_TRANSPORT_OPTIONS.find((o) => o.value === viewingVehicle)!.labelKey)}
            description={t(CITY_TRANSPORT_DETAILS[viewingVehicle].descriptionKey)}
            onClose={() => setViewingVehicle(null)}
            closeLabel={t("common_close")}
            escHint={t("market_itinerary_overlay_esc_hint")}
          />
        )}
        {viewingHotel && (
          <DetailOverlay
            image={viewingHotel.image}
            title={t(viewingHotel.label)}
            description={t(viewingHotel.description)}
            onClose={() => setViewingHotel(null)}
            closeLabel={t("common_close")}
            escHint={t("market_itinerary_overlay_esc_hint")}
          />
        )}

        <div className={`${D.studioFooter} flex flex-col-reverse gap-2 px-4 py-3 sm:flex-row sm:flex-wrap sm:justify-end sm:px-6`}>
          <button
            type="button"
            disabled={submitting}
            aria-busy={submitting ? true : undefined}
            onClick={bag.requestClose}
            className={`${touchTargetLink44Classes} ${travelFocusRingCoreOffset2Classes} ${D.studioFooterGhost} w-full sm:w-auto disabled:opacity-60`}
          >
            {t("common_cancel")}
          </button>
          <button
            type="submit"
            form={mainFormId}
            disabled={submitting}
            aria-busy={submitting ? true : undefined}
            data-testid="custom-itinerary-submit"
            className={`${touchTargetLink44Classes} ${travelFocusRingCoreOffset2Classes} ${TT_MARKETING_BTN_MARKET_PRIMARY} w-full sm:w-auto disabled:pointer-events-none disabled:opacity-60`}
          >
            {submitting ? t("market_confirmCreating") : t("market_confirmCreate")}
          </button>
        </div>
      </div>
    </MarketGlassModalFrame>
    <DiscardConfirmModal
      open={discardConfirmOpen}
      onCancel={cancelDiscardConfirm}
      onConfirm={acceptDiscardConfirm}
    />
    </>,
    document.body,
  );
}
