"use client";

import { CIM, CIM_CHOICE, CIM_FOCUS, CIM_FOCUS_WITHIN } from '../customItineraryModalTheme';
import Image from "next/image";
import { useId, type Dispatch, type SetStateAction } from "react";
import type { MutableRefObject, RefObject } from "react";
import type { CustomItineraryForm } from "../types";
import type { GuideQuoteBreakdown } from "../useQuoteCalculation";
import { DESCRIPTION_MAX_LENGTH, MAX_COVER_FILE_SIZE } from "../constants";
import { sanitizeDecimalInput } from "../utils";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { headcountPricingNoteKey } from "../itineraryFormCountryCopy";

export interface GuideFormQuoteAndCoverSectionProps {
  form: CustomItineraryForm;
  setForm: Dispatch<SetStateAction<CustomItineraryForm>>;
  guideQuoteBreakdown: GuideQuoteBreakdown;
  hasGuideInterCity: boolean;
  labelClass: string;
  inputClass: string;
  guideHasEditedAmountRef: MutableRefObject<boolean>;
  setViewingGuideImage: (v: { label: string; url: string } | null) => void;
  viewingGuideImage: { label: string; url: string } | null;
  submitErrorRef: RefObject<HTMLParagraphElement | null>;
  submitError: string | null;
  submitErrorNoticeId: string;
  coverFileTooBig: boolean;
  setCoverFileTooBig: (v: boolean) => void;
  t: (key: string) => string;
}

export default function GuideFormQuoteAndCoverSection({
  form,
  setForm,
  guideQuoteBreakdown,
  hasGuideInterCity,
  labelClass,
  inputClass,
  guideHasEditedAmountRef,
  setViewingGuideImage,
  viewingGuideImage,
  submitErrorRef,
  submitError,
  submitErrorNoticeId,
  coverFileTooBig,
  setCoverFileTooBig,
  t,
}: GuideFormQuoteAndCoverSectionProps) {
  const guideImagePreviewTitleId = useId();
  const guideImagePreviewDescId = useId();
  const attractionFeeId = useId();
  const foodFeeId = useId();
  const descriptionId = useId();
  const amountId = useId();
  const headcountId = useId();
  const coverImageUrlId = useId();
  return (
    <>
      <div className={CIM.customItineraryPanelDay}>
        <h3 className="text-small font-semibold text-white drop-shadow-market-pill">
          {t("market_guideTripCostDetail")}
        </h3>
        <p className="text-meta text-white/70">{t("market_guideTripCostDetailHint")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor={attractionFeeId} className={labelClass}>
              {t("market_guideAttractionFee")}
            </label>
            <input
              id={attractionFeeId}
              type="text"
              inputMode="decimal"
              value={form.guideAttractionFee}
              onChange={(e) => setForm((f) => ({ ...f, guideAttractionFee: sanitizeDecimalInput(e.target.value) }))}
              className={inputClass}
              placeholder={t("ui_placeholder_numeric_zero")}
            />
          </div>
          <div>
            <label htmlFor={foodFeeId} className={labelClass}>
              {t("market_guideFoodFee")}
            </label>
            <input
              id={foodFeeId}
              type="text"
              inputMode="decimal"
              value={form.guideFoodFee}
              onChange={(e) => setForm((f) => ({ ...f, guideFoodFee: sanitizeDecimalInput(e.target.value) }))}
              className={inputClass}
              placeholder={t("ui_placeholder_numeric_zero")}
            />
          </div>
        </div>
      </div>

      {form.country && (
        <div className={CIM.customItineraryPanelQuote}>
          <h3 className="text-small font-semibold text-white drop-shadow-market-pill">
            {t("market_quoteListTitle")}
          </h3>
          <p className="text-meta text-white/70">
            {t("market_guideQuoteByHeadcount").replace("{{n}}", String(guideQuoteBreakdown.headcount))}
          </p>
          <ul className="text-meta text-white/90 space-y-1">
            {guideQuoteBreakdown.attractionTotal > 0 && (
              <li>
                {t("market_budgetBreakdownAttractions")}：{guideQuoteBreakdown.attractionTotal}
                {t("ui_currency_suffix_usdc")}
              </li>
            )}
            {guideQuoteBreakdown.foodTotal > 0 && (
              <li>
                {t("market_budgetBreakdownFood")}：{guideQuoteBreakdown.foodTotal}
                {t("ui_currency_suffix_usdc")}
              </li>
            )}
            {guideQuoteBreakdown.hotelTotal > 0 && (
              <li>
                {t("market_budgetBreakdownHotel")}：{guideQuoteBreakdown.hotelTotal}
                {t("ui_currency_suffix_usdc")}
              </li>
            )}
            {guideQuoteBreakdown.guideTotal > 0 && (
              <li>
                {t("market_budgetBreakdownGuide")}：{guideQuoteBreakdown.guideTotal}
                {t("ui_currency_suffix_usdc")}
              </li>
            )}
            {guideQuoteBreakdown.cityTransportFee > 0 && (
              <li>
                {t("market_cityTransportFee")}：{guideQuoteBreakdown.cityTransportFee}
                {t("ui_currency_suffix_usdc")}
              </li>
            )}
            {hasGuideInterCity && guideQuoteBreakdown.interCityFee > 0 && (
              <li>
                {t("market_interCityTransportFee")}：{guideQuoteBreakdown.interCityFee}
                {t("ui_currency_suffix_usdc")}
              </li>
            )}
          </ul>
          <p className="text-small font-semibold text-white pt-2 border-t border-ref-sun/14">
            {t("market_quoteTotal")}：{guideQuoteBreakdown.total}
            {t("ui_currency_suffix_usdc")}
          </p>
          <p className="text-meta text-white/80">
            {t("market_budgetPerDayEst")} {t("market_budgetPerDayValue").replace("{{amount}}", String(guideQuoteBreakdown.perDay))}
          </p>
        </div>
      )}

      <div>
        <label htmlFor={descriptionId} className={labelClass}>
          {t("market_description")}
        </label>
        <textarea
          id={descriptionId}
          rows={2}
          maxLength={DESCRIPTION_MAX_LENGTH}
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value.slice(0, DESCRIPTION_MAX_LENGTH) }))
          }
          className={`${inputClass} resize-y`}
          placeholder={t("market_descriptionPlaceholder")}
        />
        <p className="text-meta text-white/50 mt-0.5">{t("market_descriptionLength").replace("{{n}}", String(form.description.length))}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor={amountId} className={labelClass}>
            {t("market_guideQuoteAmount")} *
          </label>
          <input
            id={amountId}
            type="text"
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => {
              guideHasEditedAmountRef.current = true;
              setForm((f) => ({ ...f, amount: sanitizeDecimalInput(e.target.value) }));
            }}
            className={inputClass}
            placeholder={t("market_budgetPlaceholder")}
          />
          <p className="text-meta text-white/70 mt-1">{t("market_guideQuoteAmountHint")}</p>
        </div>
        <div>
          <label htmlFor={headcountId} className={labelClass}>
            {t("market_headcount")} *
          </label>
          <input
            id={headcountId}
            type="number"
            min={1}
            max={20}
            value={form.headcount}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v)) setForm((f) => ({ ...f, headcount: Math.min(20, Math.max(1, v)) }));
            }}
            className={inputClass}
            placeholder={t("market_headcountPlaceholder")}
          />
          <p className="text-meta text-white/70 mt-1">{t(headcountPricingNoteKey(form.country))}</p>
        </div>
      </div>
      {form.amount.trim() && form.headcount >= 1 &&
        (() => {
          const total = parseFloat(form.amount.replace(/,/g, ""));
          if (isNaN(total) || total <= 0) return null;
          const perCapita = Math.round(total / form.headcount);
          return (
            <p className="text-meta text-white/70">
              {t("market_perCapitaHint").replace("{{amount}}", String(perCapita))}
            </p>
          );
        })()}
      <div>
        <label htmlFor={coverImageUrlId} className={labelClass}>
          {t("market_coverImage")}
        </label>
        <p className="text-meta text-white/70 mb-1">{t("market_guideCoverHint")}</p>
        <div className="flex flex-wrap gap-2 items-center">
          <label className="inline-flex min-h-[44px] cursor-pointer items-center justify-start rounded-[var(--radius-sm)] border border-ref-sun/24 bg-ink-900/55 px-3 py-2 text-small text-white hover:bg-white/10 {CIM_FOCUS_WITHIN}">
            <span className="sr-only">{t("market_coverImage")}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setCoverFileTooBig(false);
                if (file.size > MAX_COVER_FILE_SIZE) {
                  setCoverFileTooBig(true);
                  setForm((f) => ({ ...f, image: "" }));
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => setForm((f) => ({ ...f, image: reader.result as string }));
                reader.readAsDataURL(file);
              }}
            />
            {t("market_coverUpload")}
          </label>
          <input
            id={coverImageUrlId}
            type="url"
            maxLength={4096}
            value={typeof form.image === "string" && !form.image.startsWith("data:") ? form.image : ""}
            onChange={(e) => setForm((f) => ({ ...f, image: e.target.value.slice(0, 4096) }))}
            className={`${inputClass} flex-1 min-w-[180px]`}
            placeholder={t("market_coverImagePlaceholder")}
          />
        </div>
        {form.image && (
          <div className="mt-2 flex items-center gap-2">
            <form
              className="inline shrink-0"
              onSubmit={(e) => {
                e.preventDefault();
                setViewingGuideImage({ label: t("market_coverImage"), url: form.image });
              }}
            >
              <button
                type="submit"
                className="relative w-20 h-20 rounded-[var(--radius-sm)] overflow-hidden border border-ref-sun/16 bg-ink-950/60 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
              >
                <Image
                  src={form.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="80px"
                  unoptimized
                  onError={() => setForm((f) => ({ ...f, image: "" }))}
                />
              </button>
            </form>
            <form
              className="inline"
              onSubmit={(e) => {
                e.preventDefault();
                setForm((f) => ({ ...f, image: "" }));
              }}
            >
              <button
                type="submit"
                className={`${touchTargetLink44Classes} text-meta text-white/80 hover:text-white border border-ref-sun/24 rounded-[var(--radius-sm)] px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]`}
              >
                {t("market_coverClear")}
              </button>
            </form>
          </div>
        )}
      </div>

      {viewingGuideImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={guideImagePreviewTitleId}
          aria-describedby={guideImagePreviewDescId}
          onClick={() => setViewingGuideImage(null)}
        >
          <div
            className={CIM.customItineraryOverlayPanel}
            onClick={(e) => e.stopPropagation()}
          >
            <p id={guideImagePreviewDescId} className="sr-only">
              {t("market_guideCoverHint")}
            </p>
            <div className="relative aspect-[4/3] bg-slate-800">
              <Image
                src={viewingGuideImage.url}
                alt={viewingGuideImage.label}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="p-4">
              <h4 id={guideImagePreviewTitleId} className="text-body font-semibold text-white">
                {viewingGuideImage.label}
              </h4>
            </div>
            <form
              className="absolute top-2 right-2 inline"
              onSubmit={(e) => {
                e.preventDefault();
                setViewingGuideImage(null);
              }}
            >
              <button
                type="submit"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label={t("common_close")}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}

      {submitError && (
        <p id={submitErrorNoticeId} ref={submitErrorRef as RefObject<HTMLParagraphElement> | undefined} className="text-small text-warning" role="alert">
          {submitError}
        </p>
      )}
    </>
  );
}
