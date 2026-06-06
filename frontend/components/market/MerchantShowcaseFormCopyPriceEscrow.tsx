"use client";

import type { Dispatch, SetStateAction } from "react";
import type { MerchantStudioDraft } from "./merchantShowcaseStudioModel";
import { merchantStudioDescClass, merchantStudioInputClass, merchantStudioLabelClass } from "./merchantShowcaseStudioModel";
import { TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";

const D = TT_MARKETING_MARKET_DARK_PATH;

type TFn = (key: string) => string;

type Props = {
  t: TFn;
  form: MerchantStudioDraft;
  setForm: Dispatch<SetStateAction<MerchantStudioDraft>>;
};

export function MerchantShowcaseFormCopyPriceEscrow({ t, form, setForm }: Props) {
  const labelClass = merchantStudioLabelClass;
  const inputClass = merchantStudioInputClass;
  const descClass = merchantStudioDescClass;

  return (
    <>
      <section className="space-y-4" aria-labelledby="m-studio-copy">
        <h3 id="m-studio-copy" className={D.studioSectionHeading}>
          {t("market_merchantStudio_section_copy")}
        </h3>
        <div>
          <label className={labelClass} htmlFor="m-studio-highlights">
            {t("market_merchantStudio_field_highlights")}
          </label>
          <textarea
            id="m-studio-highlights"
            className={`${inputClass} min-h-[5rem] resize-y`}
            value={form.highlightsText}
            onChange={(e) => setForm((f) => ({ ...f, highlightsText: e.target.value }))}
            placeholder={t("market_merchantStudio_ph_highlights")}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="m-studio-desc">
            {t("market_merchantStudio_field_description")}
          </label>
          <textarea
            id="m-studio-desc"
            className={`${inputClass} min-h-[7rem] resize-y`}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder={t("market_merchantStudio_ph_description")}
          />
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="m-studio-price-heading">
        <h3 id="m-studio-price-heading" className={D.studioSectionHeading}>
          {t("market_merchantStudio_section_price")}
        </h3>
        <div>
          <label className={labelClass} htmlFor="m-studio-price">
            {t("market_merchantStudio_field_price")}
          </label>
          <input
            id="m-studio-price"
            className={inputClass}
            value={form.priceUsdc}
            onChange={(e) => setForm((f) => ({ ...f, priceUsdc: e.target.value }))}
            placeholder="520"
            inputMode="decimal"
            autoComplete="off"
          />
          <p className={descClass}>{t("market_merchantStudio_price_hint")}</p>
        </div>
      </section>

      <section
        className="rounded-[var(--radius-md)] border border-white/12 bg-ink-900/35 p-6 space-y-2"
        aria-labelledby="m-studio-escrow-path"
      >
        <h3 id="m-studio-escrow-path" className={D.studioSectionHeading}>
          {t("market_merchantStudio_section_escrow_path")}
        </h3>
        <p className="text-meta leading-relaxed text-slate-300/95">{t("market_merchantStudio_escrow_path_body")}</p>
      </section>

      <section className="rounded-[var(--radius-md)] border border-white/12 bg-ink-900/40 p-6 space-y-4">
        <label className="flex min-h-[44px] cursor-pointer items-start gap-3 text-small text-white/90">
          <input
            type="checkbox"
            checked={form.agreeEscrowCopy}
            onChange={(e) => setForm((f) => ({ ...f, agreeEscrowCopy: e.target.checked }))}
            className="mt-1 rounded border-ref-sun/35 bg-white/5 text-ref-sun focus:ring-ref-sun/50"
          />
          <span>{t("market_merchantStudio_escrow_ack")}</span>
        </label>
      </section>
    </>
  );
}
