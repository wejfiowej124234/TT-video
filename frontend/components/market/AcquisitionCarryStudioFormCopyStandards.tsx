"use client";

import type { Dispatch, SetStateAction } from "react";
import { marketStudioModalSectionHeadingLight } from "./marketStudioModalLayout";
import type { AcquisitionStudioDraft } from "./acquisitionCarryStudioModel";
import { acquisitionStudioInputClass, acquisitionStudioLabelClass } from "./acquisitionCarryStudioModel";

type TFn = (key: string) => string;

type Props = {
  t: TFn;
  form: AcquisitionStudioDraft;
  setForm: Dispatch<SetStateAction<AcquisitionStudioDraft>>;
};

export function AcquisitionCarryStudioFormCopyStandards({ t, form, setForm }: Props) {
  const labelClass = acquisitionStudioLabelClass;
  const inputClass = acquisitionStudioInputClass;

  return (
    <>
      <section className="space-y-4" aria-labelledby="a-studio-copy">
        <h3 id="a-studio-copy" className={marketStudioModalSectionHeadingLight}>
          {t("market_acquisitionStudio_section_copy")}
        </h3>
        <div>
          <label className={labelClass} htmlFor="a-studio-highlights">
            {t("market_acquisitionStudio_field_highlights")}
          </label>
          <textarea
            id="a-studio-highlights"
            className={`${inputClass} min-h-[5rem] resize-y`}
            value={form.highlightsText}
            onChange={(e) => setForm((f) => ({ ...f, highlightsText: e.target.value }))}
            placeholder={t("market_acquisitionStudio_ph_highlights")}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="a-studio-desc">
            {t("market_acquisitionStudio_field_story")}
          </label>
          <textarea
            id="a-studio-desc"
            className={`${inputClass} min-h-[7rem] resize-y`}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder={t("market_acquisitionStudio_ph_story")}
          />
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="a-studio-standards">
        <h3 id="a-studio-standards" className={marketStudioModalSectionHeadingLight}>
          {t("market_acquisitionStudio_section_standards")}
        </h3>
        <p className="text-meta text-slate-400">{t("market_acquisitionStudio_standards_hint")}</p>
        <div>
          <label className={labelClass} htmlFor="a-insp">
            {t("market_subsite_acquisition_inspection")}
          </label>
          <textarea
            id="a-insp"
            className={`${inputClass} min-h-[4rem] resize-y`}
            value={form.inspectionStandard}
            onChange={(e) => setForm((f) => ({ ...f, inspectionStandard: e.target.value }))}
            placeholder={t("market_acquisitionStudio_ph_inspection")}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="a-auth">
            {t("market_subsite_acquisition_authenticity")}
          </label>
          <textarea
            id="a-auth"
            className={`${inputClass} min-h-[3.5rem] resize-y`}
            value={form.authenticity}
            onChange={(e) => setForm((f) => ({ ...f, authenticity: e.target.value }))}
            placeholder={t("market_acquisitionStudio_ph_authenticity")}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="a-cond">
            {t("market_subsite_acquisition_condition")}
          </label>
          <textarea
            id="a-cond"
            className={`${inputClass} min-h-[3.5rem] resize-y`}
            value={form.condition}
            onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
            placeholder={t("market_acquisitionStudio_ph_condition")}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="a-rej">
            {t("market_subsite_acquisition_rejections")}
          </label>
          <textarea
            id="a-rej"
            className={`${inputClass} min-h-[3.5rem] resize-y`}
            value={form.rejections}
            onChange={(e) => setForm((f) => ({ ...f, rejections: e.target.value }))}
            placeholder={t("market_acquisitionStudio_ph_rejections")}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="a-hand">
            {t("market_subsite_acquisition_handoff")}
          </label>
          <textarea
            id="a-hand"
            className={`${inputClass} min-h-[3.5rem] resize-y`}
            value={form.handoff}
            onChange={(e) => setForm((f) => ({ ...f, handoff: e.target.value }))}
            placeholder={t("market_acquisitionStudio_ph_handoff")}
          />
        </div>
      </section>

      <section className="rounded-[var(--radius-md)] border border-warning/20 bg-ink-900/40 p-6 space-y-4">
        <label className="flex min-h-[44px] cursor-pointer items-start gap-3 text-small text-white/90">
          <input
            type="checkbox"
            checked={form.agreeEscrowCopy}
            onChange={(e) => setForm((f) => ({ ...f, agreeEscrowCopy: e.target.checked }))}
            className="mt-1 rounded border-white/30 text-white bg-white/5"
          />
          <span>{t("market_acquisitionStudio_escrow_ack")}</span>
        </label>
      </section>
    </>
  );
}
