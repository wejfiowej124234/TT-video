"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "@/components/LocaleProvider";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import type { AcquisitionCategorySlug } from "@/lib/marketSubsiteDemo";
import { ACQUISITION_CATEGORY_SLUGS } from "@/lib/marketSubsiteFilters";
import {
  acquisitionStudioDraftFingerprint,
  persistAcquisitionCarryStudioDraft,
  publishAcquisitionCarryStudioCatalog,
} from "@/lib/marketStudioDraft";
import type { AcquisitionStudioDraftPersistSource } from "@/lib/marketStudioDraft";
import {
  fetchAcquisitionPublishEligibility,
  type AcquisitionPublishEligibility,
} from "@/lib/acquisition/acquisitionPublishEligibility";
import { acquisitionL5BondCalloutDataAttrs, TT_ACQUISITION_L5 } from "@/lib/acquisition/acquisitionL5";
import { getMeFull } from "@/lib/apiClient";
import { parseMeTrustFromMeResponse, userFromGetMePayload, type MeTrustSummary } from "@/lib/meTrust";
import MeAcquisitionPublishBondAction from "@/components/me/MeAcquisitionPublishBondAction";
import {
  hasCommunityPublishAuth,
  publishAcquisitionCarryCommunityPost,
} from "@/lib/marketProductCommunityPublish";
import { PRODUCT_COUNTRIES } from "@/lib/productCountries";
import { touchTargetLink44Classes, travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";
import { trackMarketEvent } from "@/lib/analytics";
import { TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";

const COVER_MAX_BYTES = 2 * 1024 * 1024;
const PROMO_VIDEO_MAX_BYTES = 20 * 1024 * 1024;

const ACQ_CAT_LABEL: Record<AcquisitionCategorySlug, string> = {
  luxury: "market_subsite_a_cat_luxury",
  sneakers: "market_subsite_a_cat_sneakers",
  electronics: "market_subsite_a_cat_electronics",
  health: "market_subsite_a_cat_health",
  accessories: "market_subsite_a_cat_accessories",
};

export type AcquisitionStudioDraft = {
  title: string;
  summary: string;
  /** 货源 / 启运侧：门店、仓库、城市或国家等，与品类无关的通用描述 */
  supplyOrigin: string;
  /** 买方收货与交割期望：面交城市、可邮寄范围、时效等 */
  receiptHandoff: string;
  category: AcquisitionCategorySlug;
  destinationCountryIso: string;
  bountyMinUsdc: string;
  bountyMaxUsdc: string;
  deadlineNote: string;
  coverPreviewUrl: string | null;
  coverFileName: string | null;
  videoPreviewUrl: string | null;
  videoFileName: string | null;
  videoUrl: string;
  highlightsText: string;
  description: string;
  inspectionStandard: string;
  authenticity: string;
  condition: string;
  rejections: string;
  handoff: string;
  agreeEscrowCopy: boolean;
};

function emptyDraft(): AcquisitionStudioDraft {
  return {
    title: "",
    summary: "",
    supplyOrigin: "",
    receiptHandoff: "",
    category: "luxury",
    destinationCountryIso: "",
    bountyMinUsdc: "",
    bountyMaxUsdc: "",
    deadlineNote: "",
    coverPreviewUrl: null,
    coverFileName: null,
    videoPreviewUrl: null,
    videoFileName: null,
    videoUrl: "",
    highlightsText: "",
    description: "",
    inspectionStandard: "",
    authenticity: "",
    condition: "",
    rejections: "",
    handoff: "",
    agreeEscrowCopy: false,
  };
}

const D = TT_MARKETING_MARKET_DARK_PATH;
const labelClass = D.studioLabel;
const inputClass = D.studioInput;
const descClass = D.studioDesc;
const sectionHeading = D.studioSectionHeading;

export type AcquisitionStudioDraftSavedMeta = {
  communityPostId?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onDraftSaved?: (draft: AcquisitionStudioDraft, meta?: AcquisitionStudioDraftSavedMeta) => void;
};

/**
 * 旅行收购子站 **Acquisition studio**（收购工作台）：与商家橱窗创作台同构（隐藏 file + 显式按钮触发选择器）；**收购品类**与列表筛选一致。
 * 保存草稿会调用 **`POST …/market/acquisition/listings/drafts`**（链下/演示依部署；见 API `DATABASE_URL`）并写入 localStorage 备份。
 */
export default function AcquisitionCarryStudioModal({ open, onClose, onDraftSaved }: Props) {
  const { t, locale } = useTranslation();
  const [form, setForm] = useState<AcquisitionStudioDraft>(emptyDraft);
  const [coverTooBig, setCoverTooBig] = useState(false);
  const [videoTooBig, setVideoTooBig] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const titleId = useId();
  const descId = useId();
  const coverLabelId = useId();
  const videoLabelId = useId();

  const baselineFingerprint = useMemo(() => acquisitionStudioDraftFingerprint(emptyDraft()), []);
  const isDirty = useMemo(
    () => acquisitionStudioDraftFingerprint(form) !== baselineFingerprint,
    [baselineFingerprint, form],
  );

  const requestClose = useCallback(() => {
    if (typeof window !== "undefined" && isDirty && !window.confirm(t("market_studio_unsaved_confirm"))) return;
    onClose();
  }, [isDirty, onClose, t]);

  const trapRef = useFocusTrap(open, requestClose);

  useEffect(() => {
    if (!open) {
      setForm((prev) => {
        if (prev.coverPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(prev.coverPreviewUrl);
        if (prev.videoPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(prev.videoPreviewUrl);
        return emptyDraft();
      });
      setCoverTooBig(false);
      setVideoTooBig(false);
      setSubmitError(null);
      setSaving(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    trackMarketEvent("market_acquisition_studio_open", {});
  }, [open]);

  const revokeCover = useCallback(() => {
    if (form.coverPreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(form.coverPreviewUrl);
    }
  }, [form.coverPreviewUrl]);

  const revokeVideo = useCallback(() => {
    if (form.videoPreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(form.videoPreviewUrl);
    }
  }, [form.videoPreviewUrl]);

  useEffect(() => () => revokeCover(), [revokeCover]);
  useEffect(() => () => revokeVideo(), [revokeVideo]);

  const onCoverPick = (file: File | null) => {
    setCoverTooBig(false);
    if (!file) return;
    if (file.size > COVER_MAX_BYTES) {
      setCoverTooBig(true);
      return;
    }
    revokeCover();
    const url = URL.createObjectURL(file);
    setForm((f) => ({ ...f, coverPreviewUrl: url, coverFileName: file.name }));
  };

  const clearCover = () => {
    revokeCover();
    setForm((f) => ({ ...f, coverPreviewUrl: null, coverFileName: null }));
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  const onVideoPick = (file: File | null) => {
    setVideoTooBig(false);
    if (!file) return;
    if (file.size > PROMO_VIDEO_MAX_BYTES) {
      setVideoTooBig(true);
      return;
    }
    setForm((f) => {
      if (f.videoPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(f.videoPreviewUrl);
      return {
        ...f,
        videoPreviewUrl: URL.createObjectURL(file),
        videoFileName: file.name,
      };
    });
  };

  const clearVideo = () => {
    revokeVideo();
    setForm((f) => ({ ...f, videoPreviewUrl: null, videoFileName: null }));
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const categoryOptions = useMemo(
    () => ACQUISITION_CATEGORY_SLUGS.map((slug) => ({ value: slug, labelKey: ACQ_CAT_LABEL[slug] })),
    [],
  );

  const [authEpoch, setAuthEpoch] = useState(0);
  useEffect(() => {
    const onAuth = () => setAuthEpoch((n) => n + 1);
    if (typeof window === "undefined") return;
    window.addEventListener("traveltrust:auth-change", onAuth);
    return () => window.removeEventListener("traveltrust:auth-change", onAuth);
  }, []);

  const [acquisitionGate, setAcquisitionGate] =
    useState<AcquisitionPublishEligibility | null>(null);
  const [studioTrust, setStudioTrust] = useState<MeTrustSummary | null>(null);
  useEffect(() => {
    if (!open) return;
    void fetchAcquisitionPublishEligibility().then(setAcquisitionGate);
    void getMeFull({ force: true })
      .then((me) => {
        const user = userFromGetMePayload(me);
        setStudioTrust(parseMeTrustFromMeResponse(me, user));
      })
      .catch(() => setStudioTrust(null));
  }, [open, authEpoch]);

  const publishGate = useMemo(() => {
    void authEpoch;
    const title = form.title.trim();
    const iso = form.destinationCountryIso.trim().toUpperCase();
    const minN = Number(form.bountyMinUsdc);
    const maxN = Number(form.bountyMaxUsdc);
    const formOk =
      Boolean(title) &&
      iso.length === 2 &&
      Number.isFinite(minN) &&
      Number.isFinite(maxN) &&
      minN > 0 &&
      maxN > 0 &&
      minN <= 999999 &&
      maxN <= 999999 &&
      minN <= maxN &&
      form.agreeEscrowCopy;
    const sessionOk = hasCommunityPublishAuth();
    const gateOk = acquisitionGate?.ok ?? false;
    return {
      canPublish: formOk && sessionOk && gateOk,
      sessionOk,
      formOk,
      gateOk,
      titleWhenDisabled: !sessionOk
        ? t("market_studio_publish_login_hint")
        : !formOk
          ? t("market_studio_publish_form_incomplete_hint")
          : !acquisitionGate?.walletOk
            ? t("market_acquisitionStudio_publish_wallet_hint")
            : !acquisitionGate?.publishEligible
              ? t("market_acquisitionStudio_publish_bond_hint")
              : "",
    };
  }, [form, t, authEpoch, acquisitionGate]);

  const runPersistAndSync = useCallback(async () => {
    setSubmitError(null);
    const title = form.title.trim();
    const iso = form.destinationCountryIso.trim().toUpperCase();
    const minN = Number(form.bountyMinUsdc);
    const maxN = Number(form.bountyMaxUsdc);
    if (!title) {
      setSubmitError(t("market_acquisitionStudio_err_title"));
      return;
    }
    if (iso.length !== 2) {
      setSubmitError(t("market_acquisitionStudio_err_country"));
      return;
    }
    if (!Number.isFinite(minN) || !Number.isFinite(maxN) || minN <= 0 || maxN <= 0 || minN > 999999 || maxN > 999999) {
      setSubmitError(t("market_acquisitionStudio_err_bounty_nan"));
      return;
    }
    if (minN > maxN) {
      setSubmitError(t("market_acquisitionStudio_err_bounty_range"));
      return;
    }
    if (!form.agreeEscrowCopy) {
      setSubmitError(t("market_acquisitionStudio_err_escrow"));
      return;
    }
    setSaving(true);
    try {
      const persistSource: AcquisitionStudioDraftPersistSource = {
        title: form.title,
        summary: form.summary,
        supplyOrigin: form.supplyOrigin,
        receiptHandoff: form.receiptHandoff,
        category: form.category,
        destinationCountryIso: form.destinationCountryIso,
        bountyMinUsdc: form.bountyMinUsdc,
        bountyMaxUsdc: form.bountyMaxUsdc,
        deadlineNote: form.deadlineNote,
        coverFileName: form.coverFileName,
        videoFileName: form.videoFileName,
        videoUrl: form.videoUrl,
        highlightsText: form.highlightsText,
        description: form.description,
        inspectionStandard: form.inspectionStandard,
        authenticity: form.authenticity,
        condition: form.condition,
        rejections: form.rejections,
        handoff: form.handoff,
        agreeEscrowCopy: form.agreeEscrowCopy,
      };
      const { draft_id } = await persistAcquisitionCarryStudioDraft(persistSource);
      let publishedListingId: string | undefined;
      if (publishGate.canPublish) {
        try {
          const cat = await publishAcquisitionCarryStudioCatalog(persistSource);
          publishedListingId = cat.listing_id;
        } catch (err) {
          if (typeof window !== "undefined") {
            console.error("Acquisition catalog publish:", err);
          }
          setSubmitError(t("market_studio_catalog_publish_fail"));
          return;
        }
      }
      let communityPostId: string | undefined;
      if (hasCommunityPublishAuth()) {
        try {
          const { postId } = await publishAcquisitionCarryCommunityPost(persistSource, draft_id, {
            marketListingId: publishedListingId,
          });
          communityPostId = postId;
          trackMarketEvent("market_acquisition_studio_community_sync", { draft_id, post_id: postId });
        } catch (err) {
          if (typeof window !== "undefined") {
            console.error("Acquisition studio community sync:", err);
          }
          setSubmitError(t("market_studio_community_sync_fail"));
          return;
        }
      }
      trackMarketEvent("market_acquisition_studio_draft_save", {
        category: form.category,
        hasVideoUrl: Boolean(form.videoUrl.trim()),
        hasVideoFile: Boolean(form.videoPreviewUrl),
        hasCover: Boolean(form.coverPreviewUrl),
        draft_id,
        persist: "api",
        community_sync: hasCommunityPublishAuth() ? "attempted" : "skipped_no_auth",
      });
      onDraftSaved?.(form, communityPostId ? { communityPostId } : undefined);
      onClose();
    } catch {
      setSubmitError(t("market_studio_draft_api_fail"));
    } finally {
      setSaving(false);
    }
  }, [form, onClose, onDraftSaved, publishGate.canPublish, t]);

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    await runPersistAndSync();
  };

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
              {t("market_acquisitionStudio_title")}
            </h2>
            <p id={descId} className={descClass}>
              {t("market_acquisitionStudio_desc")}
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
              aria-label={t("market_acquisitionStudio_close")}
            >
              ✕
            </button>
          </form>
        </div>

        <form onSubmit={handleSaveDraft} className="flex flex-col flex-1 min-h-0">
          <div className="p-4 sm:p-6 space-y-6 overflow-y-auto text-slate-100">
            {submitError ? (
              <p
                className="rounded-[var(--radius-sm)] border border-warning/40 bg-warning/15 px-3 py-2 text-small text-white"
                role="alert"
              >
                {submitError}
              </p>
            ) : null}

            <p className="rounded-[var(--radius-sm)] border border-warning/35 bg-warning/10 px-3 py-2 text-meta text-white/95">
              {t("market_studio_demo_banner")}
            </p>

            <section className="space-y-3" aria-labelledby="a-studio-brief">
              <h3 id="a-studio-brief" className={sectionHeading}>
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

              <div className={D.studioInsetPanel}>
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
                        form.category === opt.value ? D.studioChipActive : D.studioChipIdle
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

            <section className="space-y-3" aria-labelledby="a-studio-bounty">
              <h3 id="a-studio-bounty" className={sectionHeading}>
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

            <section className="space-y-3" aria-labelledby="a-studio-media">
              <h3 id="a-studio-media" className={sectionHeading}>
                {t("market_acquisitionStudio_section_media")}
              </h3>
              <p className="text-meta text-slate-400">{t("market_acquisitionStudio_media_hint")}</p>
              <div className="space-y-2">
                <div id={coverLabelId} className={labelClass}>
                  {t("market_acquisitionStudio_field_cover")}
                </div>
                <input
                  ref={coverInputRef}
                  id="a-studio-cover"
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
                {coverTooBig ? (
                  <p className="mt-1 text-meta text-white/95">{t("market_merchantStudio_cover_too_big")}</p>
                ) : null}
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
                  id="a-studio-promo-video"
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
                <label className={labelClass} htmlFor="a-studio-video-url">
                  {t("market_merchantStudio_field_video_url")}
                </label>
                <input
                  id="a-studio-video-url"
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

            <section className="space-y-3" aria-labelledby="a-studio-copy">
              <h3 id="a-studio-copy" className={sectionHeading}>
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

            <section className="space-y-3" aria-labelledby="a-studio-standards">
              <h3 id="a-studio-standards" className={sectionHeading}>
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

            <section className="rounded-[var(--radius-md)] border border-warning/20 bg-ink-900/40 p-4 space-y-3">
              <label className="flex min-h-[44px] cursor-pointer items-start gap-3 text-small text-white/90">
                <input
                  type="checkbox"
                  checked={form.agreeEscrowCopy}
                  onChange={(e) => setForm((f) => ({ ...f, agreeEscrowCopy: e.target.checked }))}
                  className={D.studioCheckbox}
                />
                <span>{t("market_acquisitionStudio_escrow_ack")}</span>
              </label>
            </section>

            {studioTrust &&
            acquisitionGate?.sessionOk &&
            acquisitionGate.walletOk &&
            !acquisitionGate.publishEligible ? (
              <div {...acquisitionL5BondCalloutDataAttrs()} className={TT_ACQUISITION_L5.bondCallout}>
                <MeAcquisitionPublishBondAction
                  t={t}
                  trust={studioTrust}
                  compact
                  onBondLocked={() => {
                    void fetchAcquisitionPublishEligibility().then(setAcquisitionGate);
                    void getMeFull({ force: true })
                      .then((me) => {
                        const user = userFromGetMePayload(me);
                        setStudioTrust(parseMeTrustFromMeResponse(me, user));
                      })
                      .catch(() => setStudioTrust(null));
                  }}
                />
              </div>
            ) : null}
          </div>

          <div className={D.studioFooter}>
            {!publishGate.canPublish ? (
              <p
                className="border-b border-warning/20 px-4 py-2.5 sm:px-6 text-[0.7rem] leading-snug text-white/95"
                role="status"
              >
                {!publishGate.sessionOk
                  ? t("market_studio_publish_footer_strip_no_session")
                  : t("market_studio_publish_footer_strip_form_acquisition")}
              </p>
            ) : null}
            <div className="flex flex-col-reverse gap-2 px-4 py-3 sm:flex-row sm:flex-wrap sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={requestClose}
              className={`${touchTargetLink44Classes} ${travelFocusRingCoreOffset2Classes} ${D.studioFooterGhost}`}
            >
              {t("market_merchantStudio_cancel")}
            </button>
            <button
              type="button"
              disabled={saving || !publishGate.canPublish}
              title={
                saving
                  ? t("market_acquisitionStudio_saving")
                  : !publishGate.canPublish
                    ? publishGate.titleWhenDisabled || t("market_studio_publish_login_hint")
                    : t("market_studio_publish_tooltip")
              }
              onClick={() => void runPersistAndSync()}
              className={`${touchTargetLink44Classes} ${travelFocusRingCoreOffset2Classes} w-full sm:w-auto rounded-[var(--radius-sm)] border px-4 py-2.5 text-small font-medium ${
                saving || !publishGate.canPublish
                  ? D.studioPublishDisabled
                  : "border-warning/45 bg-warning/15 text-white hover:bg-warning/25 motion-sub"
              }`}
            >
              {t("market_studio_publish")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`${touchTargetLink44Classes} ${travelFocusRingCoreOffset2Classes} w-full sm:w-auto rounded-[var(--radius-sm)] bg-gradient-to-r from-amber-600/90 via-amber-500 to-amber-600/90 px-5 py-2.5 text-small font-semibold text-white shadow-[0_0_20px_-6px_rgba(245,158,11,0.35)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {saving ? t("market_acquisitionStudio_saving") : t("market_acquisitionStudio_save_draft")}
            </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
