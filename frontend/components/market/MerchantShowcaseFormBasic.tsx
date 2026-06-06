"use client";

import type { Dispatch, SetStateAction } from "react";
import { PRODUCT_COUNTRIES } from "@/lib/productCountries";
import { marketStudioModalSectionHeadingCyan } from "./marketStudioModalLayout";
import type { MerchantStudioDraft } from "./merchantShowcaseStudioModel";
import { merchantStudioInputClass, merchantStudioLabelClass } from "./merchantShowcaseStudioModel";
import { TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";

const D = TT_MARKETING_MARKET_DARK_PATH;

type TFn = (key: string) => string;

type Props = {
  t: TFn;
  locale: string;
  form: MerchantStudioDraft;
  setForm: Dispatch<SetStateAction<MerchantStudioDraft>>;
  categoryOptions: ReadonlyArray<{ value: MerchantStudioDraft["category"]; labelKey: string }>;
};

export function MerchantShowcaseFormBasic({ t, locale, form, setForm, categoryOptions }: Props) {
  const labelClass = merchantStudioLabelClass;
  const inputClass = merchantStudioInputClass;

  return (
    <section className="space-y-4" aria-labelledby="m-studio-basic">
      <h3 id="m-studio-basic" className={marketStudioModalSectionHeadingCyan}>
        {t("market_merchantStudio_section_basic")}
      </h3>
      <div>
        <label className={labelClass} htmlFor="m-studio-title">
          {t("market_merchantStudio_field_title")}
        </label>
        <input
          id="m-studio-title"
          className={inputClass}
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder={t("market_merchantStudio_ph_title")}
          maxLength={120}
          autoComplete="off"
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="m-studio-sub">
          {t("market_merchantStudio_field_subtitle")}
        </label>
        <input
          id="m-studio-sub"
          className={inputClass}
          value={form.subtitle}
          onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
          placeholder={t("market_merchantStudio_ph_subtitle")}
          maxLength={180}
          autoComplete="off"
        />
      </div>
      <div>
        <span className={labelClass}>{t("market_merchantStudio_field_category")}</span>
        <div className="flex flex-wrap gap-2 mt-1">
          {categoryOptions.map((opt) => (
            <label
              key={opt.value}
              className={`inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-meta ${
                form.category === opt.value ? D.studioChipActive : D.studioChipIdle
              }`}
            >
              <input
                type="radio"
                name="m-cat"
                className="sr-only"
                checked={form.category === opt.value}
                onChange={() => setForm((f) => ({ ...f, category: opt.value }))}
              />
              {t(opt.labelKey)}
            </label>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="m-studio-city">
            {t("market_merchantStudio_field_city")}
          </label>
          <input
            id="m-studio-city"
            className={inputClass}
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            placeholder={t("market_merchantStudio_ph_city")}
            autoComplete="off"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="m-studio-iso">
            {t("market_merchantStudio_field_country_iso")}
          </label>
          <select
            id="m-studio-iso"
            className={inputClass}
            value={form.countryIso}
            onChange={(e) => setForm((f) => ({ ...f, countryIso: e.target.value }))}
          >
            <option value="">{t("market_merchantStudio_country_optional")}</option>
            {PRODUCT_COUNTRIES.map((c) => (
              <option key={c.iso} value={c.iso}>
                {locale === "zh" ? c.nameZh : c.iso}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
