"use client";

import { CIM, CIM_CHOICE, CIM_FOCUS, CIM_FOCUS_WITHIN } from '../customItineraryModalTheme';
import { useId, type Dispatch, type SetStateAction } from "react";
import type { CustomItineraryForm } from "../types";
import { sanitizeDecimalInput } from "../utils";
import { marketStudioModalSectionHeadingLight } from "../../marketStudioModalLayout";

export function GuideFormTripCostDetailCard({
  form,
  setForm,
  labelClass,
  inputClass,
  t,
}: {
  form: CustomItineraryForm;
  setForm: Dispatch<SetStateAction<CustomItineraryForm>>;
  labelClass: string;
  inputClass: string;
  t: (key: string) => string;
}) {
  const attractionFeeId = useId();
  const foodFeeId = useId();
  return (
    <div className={CIM.customItineraryPanelLg}>
      <h3 className={`${marketStudioModalSectionHeadingLight} drop-shadow-market-pill`}>
        {t("market_guideTripCostDetail")}
      </h3>
      <p className="text-meta text-white/70">{t("market_guideTripCostDetailHint")}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
  );
}
