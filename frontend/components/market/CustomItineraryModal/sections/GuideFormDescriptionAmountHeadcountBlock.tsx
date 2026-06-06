"use client";

import { useId, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import type { CustomItineraryForm } from "../types";
import { DESCRIPTION_MAX_LENGTH } from "../constants";
import { sanitizeDecimalInput } from "../utils";

export function GuideFormDescriptionAmountHeadcountBlock({
  form,
  setForm,
  labelClass,
  inputClass,
  guideHasEditedAmountRef,
  t,
}: {
  form: CustomItineraryForm;
  setForm: Dispatch<SetStateAction<CustomItineraryForm>>;
  labelClass: string;
  inputClass: string;
  guideHasEditedAmountRef: MutableRefObject<boolean>;
  t: (key: string) => string;
}) {
  const descriptionId = useId();
  const amountId = useId();
  const headcountId = useId();
  return (
    <>
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
        <p className="text-meta text-white/50 mt-0.5">
          {t("market_descriptionLength").replace("{{n}}", String(form.description.length))}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <p className="text-meta text-white/70 mt-1">{t("market_headcountPricingNote")}</p>
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
    </>
  );
}
