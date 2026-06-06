"use client";

import type { Dispatch, SetStateAction } from "react";
import { PRODUCT_COUNTRIES } from "@/lib/productCountries";
import { marketStudioModalSectionHeadingLight } from "./marketStudioModalLayout";
import type { AcquisitionStudioDraft } from "./acquisitionCarryStudioModel";
import {
  acquisitionStudioDescClass,
  acquisitionStudioInputClass,
  acquisitionStudioLabelClass,
} from "./acquisitionCarryStudioModel";

type TFn = (key: string) => string;

type Props = {
  t: TFn;
  locale: string;
  form: AcquisitionStudioDraft;
  setForm: Dispatch<SetStateAction<AcquisitionStudioDraft>>;
  categoryOptions: ReadonlyArray<{ value: AcquisitionStudioDraft["category"]; labelKey: string }>;
};

export function AcquisitionCarryStudioFormBriefBounty({ t, locale, form, setForm, categoryOptions }: Props) {
  const labelClass = acquisitionStudioLabelClass;
  const inputClass = acquisitionStudioInputClass;
  const descClass = acquisitionStudioDescClass;

  return (
    <>
      <section className="space-y-4" aria-labelledby="a-studio-brief">
        <h3 id="a-studio-brief" className={marketStudioModalSectionHeadingLight}>
          {t("market_acquisitionStudio_section_brief")}
        </h3>
        <p className="text-meta text-slate-400">{t("market_acquisitionStudio_category_hint")}</p>
        <div>
          <label className={labelClass} htmlFor="a-studio-title">
            {t("market_acquisitionStudio_field_title")}
          </label>
          <input
            id="a-studio-title"
            className={inputClass}
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder={t("market_acquisitionStudio_ph_title")}
            maxLength={120}
            autoComplete="off"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="a-studio-summary">
            {t("market_acquisitionStudio_field_summary")}
          </label>
          <input
            id="a-studio-summary"
            className={inputClass}
            value={form.summary}
            onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
            placeholder={t("market_acquisitionStudio_ph_summary")}
            maxLength={200}
            autoComplete="off"
          />
        </div>

        <div className="rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.03] p-3 space-y-3">
          <p className="text-meta font-medium text-white/90">{t("market_acquisitionStudio_section_corridor")}</p>
          <p className="text-meta leading-relaxed text-slate-400">{t("market_acquisitionStudio_corridor_hint")}</p>
          <div>
            <label className={labelClass} htmlFor="a-studio-supply">
              {t("market_acquisitionStudio_field_supply_origin")}
            </label>
            <input
              id="a-studio-supply"
              className={inputClass}
              value={form.supplyOrigin}
              onChange={(e) => setForm((f) => ({ ...f, supplyOrigin: e.target.value }))}
              placeholder={t("market_acquisitionStudio_ph_supply_origin")}
              maxLength={160}
              autoComplete="off"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="a-studio-receipt">
              {t("market_acquisitionStudio_field_receipt_handoff")}
            </label>
            <input
              id="a-studio-receipt"
              className={inputClass}
              value={form.receiptHandoff}
              onChange={(e) => setForm((f) => ({ ...f, receiptHandoff: e.target.value }))}
              placeholder={t("market_acquisitionStudio_ph_receipt_handoff")}
              maxLength={160}
              autoComplete="off"
            />
            <p className={descClass}>{t("market_acquisitionStudio_receipt_handoff_hint")}</p>
          </div>
        </div>

        <div>
          <span className={labelClass}>{t("market_acquisitionStudio_field_category")}</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {categoryOptions.map((opt) => (
              <label
                key={opt.value}
                className={`inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-meta ${
                  form.category === opt.value
                    ? "border-warning/55 bg-warning/20 text-white"
                    : "border-white/20 bg-white/5 text-white/85 hover:bg-white/10"
                }`}
              >
                <input
                  type="radio"
                  name="a-cat"
                  className="sr-only"
                  checked={form.category === opt.value}
                  onChange={() => setForm((f) => ({ ...f, category: opt.value }))}
                />
                {t(opt.labelKey)}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="a-studio-iso">
            {t("market_acquisitionStudio_field_dest_iso")}
          </label>
          <select
            id="a-studio-iso"
            className={inputClass}
            value={form.destinationCountryIso}
            onChange={(e) => setForm((f) => ({ ...f, destinationCountryIso: e.target.value }))}
          >
            <option value="" disabled>
              {t("market_acquisitionStudio_dest_country_placeholder")}
            </option>
            {PRODUCT_COUNTRIES.map((c) => (
              <option key={c.iso} value={c.iso}>
                {locale === "zh" ? c.nameZh : c.iso}
              </option>
            ))}
          </select>
          <p className={descClass}>{t("market_acquisitionStudio_dest_iso_hint")}</p>
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="a-studio-bounty">
        <h3 id="a-studio-bounty" className={marketStudioModalSectionHeadingLight}>
          {t("market_acquisitionStudio_section_bounty")}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="a-studio-min">
              {t("market_acquisitionStudio_field_bounty_min")}
            </label>
            <input
              id="a-studio-min"
              className={inputClass}
              value={form.bountyMinUsdc}
              onChange={(e) => setForm((f) => ({ ...f, bountyMinUsdc: e.target.value }))}
              placeholder="800"
              inputMode="decimal"
              autoComplete="off"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="a-studio-max">
              {t("market_acquisitionStudio_field_bounty_max")}
            </label>
            <input
              id="a-studio-max"
              className={inputClass}
              value={form.bountyMaxUsdc}
              onChange={(e) => setForm((f) => ({ ...f, bountyMaxUsdc: e.target.value }))}
              placeholder="1200"
              inputMode="decimal"
              autoComplete="off"
            />
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="a-studio-deadline">
            {t("market_acquisitionStudio_field_deadline")}
          </label>
          <input
            id="a-studio-deadline"
            className={inputClass}
            value={form.deadlineNote}
            onChange={(e) => setForm((f) => ({ ...f, deadlineNote: e.target.value }))}
            placeholder={t("market_acquisitionStudio_ph_deadline")}
            maxLength={120}
            autoComplete="off"
          />
          <p className={descClass}>{t("market_acquisitionStudio_bounty_hint")}</p>
        </div>
      </section>
    </>
  );
}
