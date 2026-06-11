"use client";

import { useId } from "react";
import type { CustomItineraryForm } from "../types";
import type { BudgetBreakdown } from "../useQuoteCalculation";
import type { MutableRefObject, Dispatch, SetStateAction } from "react";
import { TITLE_MAX_LENGTH, DESCRIPTION_MAX_LENGTH } from "../constants";
import { sanitizeDecimalInput } from "../utils";
import { DEFAULT_SETTLEMENT_CURRENCY_CODE } from "@/lib/defaultSettlementCurrency";
import { headcountPricingNoteKey } from "../itineraryFormCountryCopy";

export interface TouristBudgetMetaFieldsProps {
  form: CustomItineraryForm;
  setForm: Dispatch<SetStateAction<CustomItineraryForm>>;
  budgetBreakdown: BudgetBreakdown;
  budgetSuggestion: { min: number; max: number };
  userHasEditedBudgetRef: MutableRefObject<boolean>;
  labelClass: string;
  inputClass: string;
  t: (key: string) => string;
}

export default function TouristBudgetMetaFields({
  form,
  setForm,
  budgetBreakdown,
  budgetSuggestion,
  userHasEditedBudgetRef,
  labelClass,
  inputClass,
  t,
}: TouristBudgetMetaFieldsProps) {
  const titleFieldId = useId();
  const amountFieldId = useId();
  const headcountFieldId = useId();
  const descriptionFieldId = useId();
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label htmlFor={titleFieldId} className={labelClass}>
            {t("market_itineraryTitle")}
          </label>
          <input
            id={titleFieldId}
            type="text"
            maxLength={TITLE_MAX_LENGTH}
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value.slice(0, TITLE_MAX_LENGTH) }))}
            className={inputClass}
            placeholder={t("market_itineraryTitlePlaceholder")}
          />
          <p className="text-meta text-white/50 mt-0.5">
            {t("market_titleLength").replace("{{n}}", String(form.title.length))}
          </p>
        </div>
        <div>
          <label htmlFor={amountFieldId} className={labelClass}>
            {t("market_budget")} ({DEFAULT_SETTLEMENT_CURRENCY_CODE}) *
          </label>
          <input
            id={amountFieldId}
            type="text"
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => {
              userHasEditedBudgetRef.current = true;
              setForm((f) => ({ ...f, amount: sanitizeDecimalInput(e.target.value) }));
            }}
            className={inputClass}
            placeholder={t("market_budgetPlaceholder")}
          />
          <p className="text-meta text-white/70 mt-1">
            {t("market_budgetSuggestion")
              .replace("{{min}}", String(budgetSuggestion.min))
              .replace("{{max}}", String(budgetSuggestion.max))}
          </p>
          {form.country && budgetBreakdown.total > 0 &&
            (() => {
              const totalAmount = parseFloat(form.amount.replace(/,/g, ""));
              const isAboveOrMatch = !isNaN(totalAmount) && totalAmount >= budgetBreakdown.total;
              return isAboveOrMatch ? (
                <p className="text-meta text-success/90 mt-1">{t("market_budgetAboveQuoteHint")}</p>
              ) : (
                <p className="text-meta text-warning/90 mt-1">{t("market_budgetBelowQuoteHint")}</p>
              );
            })()}
          {(() => {
            const totalAmount = parseFloat(form.amount.replace(/,/g, ""));
            const breakdownSum = budgetBreakdown.guideTotal + budgetBreakdown.transportTotal;
            if (isNaN(totalAmount) || totalAmount <= 0 || breakdownSum <= 0) return null;
            if (totalAmount < breakdownSum) {
              return (
                <p className="text-meta text-warning/90 mt-1">{t("market_budgetBelowBreakdown")}</p>
              );
            }
            return null;
          })()}
        </div>
        <div>
          <label htmlFor={headcountFieldId} className={labelClass}>
            {t("market_headcount")} *
          </label>
          <input
            id={headcountFieldId}
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
        <label htmlFor={descriptionFieldId} className={labelClass}>
          {t("market_description")}
        </label>
        <textarea
          id={descriptionFieldId}
          rows={2}
          maxLength={DESCRIPTION_MAX_LENGTH}
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value.slice(0, DESCRIPTION_MAX_LENGTH) }))
          }
          className={`${inputClass} resize-y`}
          placeholder={t("market_descriptionPlaceholder")}
        />
        <p className="text-meta text-white/50 mt-0.5">
          {t("market_descriptionLength").replace("{{n}}", String(form.description.length))}
        </p>
      </div>
    </>
  );
}
