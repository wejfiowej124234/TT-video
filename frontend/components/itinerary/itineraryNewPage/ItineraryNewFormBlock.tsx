"use client";

import type { FormEvent, ChangeEvent } from "react";
import Link from "next/link";
import type { ItineraryForm } from "@/components/itinerary/itineraryNewPage/itineraryNewTypes";
import { useCatalogCityOptions, useCatalogCountryOptions } from "@/lib/catalogApi/useCatalogGeo";
import type { LocaleInterpolationVars } from "@/lib/i18n";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { ITINERARY_NEW_ERROR_LOGIN_REQUIRED } from "./itineraryNewConstants";
import {
  TT_MARKETING_BTN_PRIMARY_WARM_SUBMIT,
  TT_MARKETING_CONSOLE_INLINE_LINK,
  TT_MARKETING_CONSOLE_LINK_FOCUS,
  TT_MARKETING_FOCUS_RING_CONSOLE,
  TT_MARKETING_FORM_FIELD_FOCUS_CONSOLE,
  TT_MARKETING_PILL_SELECTED_ROUND,
} from "@/lib/marketingUi";

type TFunc = (key: string, vars?: LocaleInterpolationVars) => string;

export type ItineraryNewFormBlockProps = {
  t: TFunc;
  form: ItineraryForm;
  submitting: boolean;
  error: string | null;
  formErrorId: string;
  itinNewLoginReturnPath: string;
  fid: (name: string) => string;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onCountryPill: (nameZh: string) => void;
  onCityPill: (cityName: string) => void;
};

export function ItineraryNewFormBlock({
  t,
  form,
  submitting,
  error,
  formErrorId,
  itinNewLoginReturnPath,
  fid,
  onSubmit,
  onChange,
  onCountryPill,
  onCityPill,
}: ItineraryNewFormBlockProps) {
  const countryOptions = useCatalogCountryOptions();
  const cityOptions = useCatalogCityOptions(form.destination);
  const formFieldFocus = TT_MARKETING_FORM_FIELD_FOCUS_CONSOLE;
  const inputMinH = "min-h-[44px]";
  const inlineLinkClass = `${touchTargetLink44Classes} ${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`;
  const pillBase =
    `inline-flex min-h-[44px] items-center justify-center rounded-full px-3 py-1.5 text-meta font-medium border border-ink-200 transition-colors motion-reduce:transition-none ${TT_MARKETING_FOCUS_RING_CONSOLE}`;
  const pillSelected = TT_MARKETING_PILL_SELECTED_ROUND;
  const pillUnselected = "bg-bg-soft border-ink-200 text-ink-600 hover:bg-bg-console";

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3"
      noValidate
      aria-describedby={error ? formErrorId : undefined}
    >
      <div role="group" aria-labelledby={fid("destination-legend")}>
        <span id={fid("destination-legend")} className="block text-small font-medium mb-1">
          {t("itin_label_destination")}
        </span>
        <div className="flex flex-wrap gap-2">
          {countryOptions.map((c) => (
            <button
              key={c.value}
              type="button"
              data-tt-itinerary-country-pill={c.value}
              onClick={() => onCountryPill(c.value)}
              className={`${pillBase} ${form.destination === c.value ? pillSelected : pillUnselected}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <div role="group" aria-labelledby={fid("city-legend")}>
        <span id={fid("city-legend")} className="block text-small font-medium mb-1">
          {t("itin_label_city")}
        </span>
        {!form.destination ? (
          <p className="text-meta text-ink-500 rounded-[var(--radius-sm)] border border-ink-200 bg-bg-soft px-3 py-2">
            {t("filter_selectCountryFirst")}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {cityOptions.map((c) => (
              <button
                key={c.value}
                type="button"
                data-tt-itinerary-city-pill={c.value}
                onClick={() => onCityPill(c.value)}
                className={`${pillBase} ${form.city === c.value ? pillSelected : pillUnselected}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div>
        <label htmlFor={fid("travel_date")} className="block text-small font-medium mb-1">
          {t("itin_label_date")}
        </label>
        <input
          id={fid("travel_date")}
          type="date"
          name="travel_date"
          value={form.travel_date}
          onChange={onChange}
          aria-invalid={!!error}
          aria-errormessage={error ? formErrorId : undefined}
          className={`border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 w-full ${inputMinH} bg-bg-console ${formFieldFocus}`}
        />
      </div>
      <div>
        <label htmlFor={fid("days")} className="block text-small font-medium mb-1">
          {t("itin_label_days")}
        </label>
        <input
          id={fid("days")}
          type="number"
          name="days"
          min={1}
          max={30}
          value={form.days}
          onChange={onChange}
          aria-invalid={!!error}
          aria-errormessage={error ? formErrorId : undefined}
          className={`border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 w-full ${inputMinH} bg-bg-console ${formFieldFocus}`}
        />
      </div>
      <div>
        <label htmlFor={fid("hotel_type")} className="block text-small font-medium mb-1">
          {t("itin_label_hotel")}
        </label>
        <input
          id={fid("hotel_type")}
          type="text"
          name="hotel_type"
          value={form.hotel_type}
          onChange={onChange}
          aria-invalid={!!error}
          aria-errormessage={error ? formErrorId : undefined}
          className={`border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 w-full ${inputMinH} bg-bg-console ${formFieldFocus}`}
          placeholder={t("itin_placeholder_hotel")}
          autoComplete="off"
        />
      </div>
      <div>
        <label htmlFor={fid("food_preference")} className="block text-small font-medium mb-1">
          {t("itin_label_food")}
        </label>
        <input
          id={fid("food_preference")}
          type="text"
          name="food_preference"
          value={form.food_preference}
          onChange={onChange}
          aria-invalid={!!error}
          aria-errormessage={error ? formErrorId : undefined}
          className={`border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 w-full ${inputMinH} bg-bg-console ${formFieldFocus}`}
          placeholder={t("itin_placeholder_food")}
          autoComplete="off"
        />
      </div>
      <div>
        <label htmlFor={fid("transport")} className="block text-small font-medium mb-1">
          {t("itin_label_transport")}
        </label>
        <input
          id={fid("transport")}
          type="text"
          name="transport"
          value={form.transport}
          onChange={onChange}
          aria-invalid={!!error}
          aria-errormessage={error ? formErrorId : undefined}
          className={`border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 w-full ${inputMinH} bg-bg-console ${formFieldFocus}`}
          placeholder={t("itin_placeholder_transport")}
          autoComplete="off"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor={fid("budget_min")} className="block text-small font-medium mb-1">
            {t("itin_label_budgetMin")}
          </label>
          <input
            id={fid("budget_min")}
            type="number"
            name="budget_min"
            min={0}
            step={100}
            value={form.budget_min}
            onChange={onChange}
            aria-invalid={!!error}
            aria-errormessage={error ? formErrorId : undefined}
            className={`border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 w-full ${inputMinH} bg-bg-console ${formFieldFocus}`}
            placeholder={t("itin_placeholder_optional")}
          />
        </div>
        <div>
          <label htmlFor={fid("budget_max")} className="block text-small font-medium mb-1">
            {t("itin_label_budgetMax")}
          </label>
          <input
            id={fid("budget_max")}
            type="number"
            name="budget_max"
            min={0}
            step={100}
            value={form.budget_max}
            onChange={onChange}
            aria-invalid={!!error}
            aria-errormessage={error ? formErrorId : undefined}
            className={`border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 w-full ${inputMinH} bg-bg-console ${formFieldFocus}`}
            placeholder={t("itin_placeholder_optional")}
          />
        </div>
      </div>
      <div>
        <label htmlFor={fid("notes")} className="block text-small font-medium mb-1">
          {t("itin_label_notes")}
        </label>
        <textarea
          id={fid("notes")}
          name="notes"
          value={form.notes}
          onChange={onChange}
          aria-invalid={!!error}
          aria-errormessage={error ? formErrorId : undefined}
          className={`min-h-[80px] border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 w-full bg-bg-console ${formFieldFocus}`}
          placeholder={t("itin_placeholder_optional")}
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        aria-busy={submitting ? true : undefined}
        className={`${TT_MARKETING_BTN_PRIMARY_WARM_SUBMIT} px-6 py-2.5 disabled:opacity-50`}
      >
        {submitting ? t("itin_submitting") : t("itin_submit")}
      </button>
      {error ? (
        <div
          id={formErrorId}
          className="mt-4 rounded-[var(--radius-sm)] border border-danger/30 bg-danger/10 p-3 text-small text-danger"
          role="alert"
        >
          {error === ITINERARY_NEW_ERROR_LOGIN_REQUIRED ? t("itin_error_loginRequired") : error}
          {error === ITINERARY_NEW_ERROR_LOGIN_REQUIRED && (
            <span className="ml-2">
              <Link
                href={`/auth/login?returnUrl=${encodeURIComponent(itinNewLoginReturnPath)}`}
                className={inlineLinkClass}
              >
                {t("itin_goLogin")}
              </Link>
            </span>
          )}
        </div>
      ) : null}
    </form>
  );
}
