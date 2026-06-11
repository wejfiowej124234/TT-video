"use client";

import { createPortal } from "react-dom";
import { useCatalogProductCountries } from "@/lib/catalogApi/useCatalogGeo";
import { TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";
import { touchTargetLink44Classes, travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";
import { MerchantShowcaseStudioModalFooter } from "@/components/market/MerchantShowcaseStudioModalFooter";
import { useMerchantShowcaseStudioModal } from "@/components/market/useMerchantShowcaseStudioModal";
import type { MerchantStudioDraft, MerchantStudioDraftSavedMeta } from "./merchantShowcaseStudioModel";

export type { MerchantStudioDraft, MerchantStudioDraftSavedMeta } from "./merchantShowcaseStudioModel";

const D = TT_MARKETING_MARKET_DARK_PATH;
const labelClass = D.studioLabel;
const inputClass = D.studioInput;
const descClass = D.studioDesc;
const sectionHeading = D.studioSectionHeading;

type Props = {
  open: boolean;
  onClose: () => void;
  onDraftSaved?: (draft: MerchantStudioDraft, meta?: MerchantStudioDraftSavedMeta) => void;
};

/**
 * 商家橱窗 **Showcase studio**（橱窗工作台）：逻辑 SSOT **`useMerchantShowcaseStudioModal`**。
 */
export default function MerchantShowcaseStudioModal({ open, onClose, onDraftSaved }: Props) {
  const {
    form,
    setForm,
    coverTooBig,
    videoTooBig,
    submitError,
    saving,
    coverInputRef,
    videoInputRef,
    titleId,
    descId,
    coverLabelId,
    videoLabelId,
    requestClose,
    trapRef,
    categoryOptions,
    publishBlockedKeys,
    canPublish,
    handleSaveDraft,
    runPersistAndSync,
    onCoverPick,
    clearCover,
    onVideoPick,
    clearVideo,
    t,
    locale,
  } = useMerchantShowcaseStudioModal({ open, onClose, onDraftSaved });
  const productCountries = useCatalogProductCountries();

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-4 pt-20 pb-8 sm:pt-16 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden onClick={requestClose} />
      <div
        ref={trapRef}
        className={D.studioModalPanelLg}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={D.studioModalHeader}>
          <div className="min-w-0">
            <h2 id={titleId} className="text-body-l font-semibold text-white drop-shadow-market-body">
              {t("market_merchantStudio_title")}
            </h2>
            <p id={descId} className={descClass}>
              {t("market_merchantStudio_desc")}
            </p>
          </div>
          <form
            className="shrink-0"
            onSubmit={(ev) => {
              ev.preventDefault();
              requestClose();
            }}
          >
            <button
              type="submit"
              className={`${touchTargetLink44Classes} ${travelFocusRingCoreOffset2Classes} ${D.studioCloseBtn}`}
              aria-label={t("market_merchantStudio_close")}
            >
              ✕
            </button>
          </form>
        </div>

        <form onSubmit={handleSaveDraft} className="flex flex-col flex-1 min-h-0">
          <div className="p-4 sm:p-6 space-y-6 overflow-y-auto text-slate-100">
            {submitError ? (
              <p className="rounded-[var(--radius-sm)] border border-warning/40 bg-warning/15 px-3 py-2 text-small text-white" role="alert">
                {submitError}
              </p>
            ) : null}

            <p className={D.studioHintBanner}>
              {t("market_studio_demo_banner")}
            </p>

            <section className="space-y-3" aria-labelledby="m-studio-basic">
              <h3 id="m-studio-basic" className={sectionHeading}>
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
                    {productCountries.map((c) => (
                      <option key={c.iso} value={c.iso}>
                        {locale === "zh" ? c.nameZh : c.iso}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="space-y-3" aria-labelledby="m-studio-media">
              <h3 id="m-studio-media" className={sectionHeading}>
                {t("market_merchantStudio_section_media")}
              </h3>
              <p className="text-meta text-slate-400">{t("market_merchantStudio_media_hint")}</p>
              <div className="space-y-2">
                <div id={coverLabelId} className={labelClass}>
                  {t("market_merchantStudio_field_cover")}
                </div>
                <input
                  ref={coverInputRef}
                  id="m-studio-cover"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  tabIndex={-1}
                  className="sr-only"
                  onChange={(e) => onCoverPick(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  aria-labelledby={coverLabelId}
                  className={`${touchTargetLink44Classes} ${travelFocusRingCoreOffset2Classes} ${D.studioMediaBtn}`}
                >
                  {t("market_merchantStudio_pick_cover")}
                </button>
                {coverTooBig ? <p className="mt-1 text-meta text-white/95">{t("market_merchantStudio_cover_too_big")}</p> : null}
                {form.coverFileName ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-meta text-slate-400 truncate max-w-full">{form.coverFileName}</span>
                    <button type="button" onClick={clearCover} className={`${touchTargetLink44Classes} text-meta ${D.studioClearLink}`}>
                      {t("market_coverClear")}
                    </button>
                  </div>
                ) : null}
              </div>
              <div className="space-y-2">
                <div id={videoLabelId} className={labelClass}>
                  {t("market_merchantStudio_field_promo_video")}
                </div>
                <input
                  ref={videoInputRef}
                  id="m-studio-promo-video"
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                  tabIndex={-1}
                  className="sr-only"
                  onChange={(e) => onVideoPick(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  aria-labelledby={videoLabelId}
                  className={`${touchTargetLink44Classes} ${travelFocusRingCoreOffset2Classes} ${D.studioMediaBtn}`}
                >
                  {t("market_merchantStudio_pick_video")}
                </button>
                <p className="mt-1 text-meta text-slate-500">{t("market_merchantStudio_video_file_hint")}</p>
                {videoTooBig ? (
                  <p className="mt-1 text-meta text-white/95">{t("market_merchantStudio_video_too_big")}</p>
                ) : null}
                {form.videoPreviewUrl ? (
                  <div className="mt-3 space-y-2">
                    <video
                      src={form.videoPreviewUrl}
                      className={D.studioImageFrame}
                      controls
                      playsInline
                      muted
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      {form.videoFileName ? (
                        <span className="text-meta text-slate-400 truncate max-w-full">{form.videoFileName}</span>
                      ) : null}
                      <button type="button" onClick={clearVideo} className={`${touchTargetLink44Classes} text-meta ${D.studioClearLink}`}>
                        {t("market_merchantStudio_video_clear")}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
              <div>
                <label className={labelClass} htmlFor="m-studio-video">
                  {t("market_merchantStudio_field_video_url")}
                </label>
                <input
                  id="m-studio-video"
                  className={inputClass}
                  value={form.videoUrl}
                  onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
                  placeholder="https://"
                  inputMode="url"
                  autoComplete="off"
                />
                <p className={descClass}>{t("market_merchantStudio_video_url_hint")}</p>
              </div>
            </section>

            <section className="space-y-3" aria-labelledby="m-studio-copy">
              <h3 id="m-studio-copy" className={sectionHeading}>
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

            <section className="space-y-3" aria-labelledby="m-studio-price">
              <h3 id="m-studio-price" className={sectionHeading}>
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

            <section className={`${D.studioEscrowSection} space-y-2`} aria-labelledby="m-studio-escrow-path">
              <h3 id="m-studio-escrow-path" className={sectionHeading}>
                {t("market_merchantStudio_section_escrow_path")}
              </h3>
              <p className="text-meta leading-relaxed text-slate-300/95">{t("market_merchantStudio_escrow_path_body")}</p>
            </section>

            <section className={D.studioEscrowSection}>
              <label className="flex min-h-[44px] cursor-pointer items-start gap-3 text-small text-slate-200">
                <input
                  type="checkbox"
                  checked={form.agreeEscrowCopy}
                  onChange={(e) => setForm((f) => ({ ...f, agreeEscrowCopy: e.target.checked }))}
                  className={D.studioCheckbox}
                />
                <span>{t("market_merchantStudio_escrow_ack")}</span>
              </label>
            </section>
          </div>

          <MerchantShowcaseStudioModalFooter
            t={t}
            canPublish={canPublish}
            saving={saving}
            publishBlockedKeys={publishBlockedKeys}
            requestClose={requestClose}
            runPersistAndSync={runPersistAndSync}
          />
        </form>
      </div>
    </div>,
    document.body,
  );
}
