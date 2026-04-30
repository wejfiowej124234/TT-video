"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "@/components/LocaleProvider";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import {
  merchantStudioDraftFingerprint,
  persistMerchantShowcaseStudioDraft,
  publishMerchantShowcaseStudioCatalog,
} from "@/lib/marketStudioDraft";
import type { MerchantStudioDraftPersistSource } from "@/lib/marketStudioDraft";
import {
  hasCommunityPublishAuth,
  publishMerchantShowcaseCommunityPost,
} from "@/lib/marketProductCommunityPublish";
import { isAllowedProductIso3166, PRODUCT_COUNTRIES } from "@/lib/productCountries";
import { touchTargetLink44Classes, travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";
import { trackMarketEvent } from "@/lib/analytics";

const COVER_MAX_BYTES = 2 * 1024 * 1024;
/** 演示上限；生产环境应走对象存储 / IPFS，不在浏览器直传超大文件 */
const PROMO_VIDEO_MAX_BYTES = 20 * 1024 * 1024;

export type MerchantShowcaseCategory = "hotel" | "dining" | "attraction" | "experience";

/** 与链上一致：橱窗商品统一走「订单 + Escrow + 双方确认里程碑」模型 */
export type MerchantDeliveryArchetype = "escrow_order";

export type MerchantStudioDraft = {
  title: string;
  subtitle: string;
  category: MerchantShowcaseCategory;
  city: string;
  countryIso: string;
  coverPreviewUrl: string | null;
  coverFileName: string | null;
  videoPreviewUrl: string | null;
  videoFileName: string | null;
  videoUrl: string;
  highlightsText: string;
  description: string;
  priceUsdc: string;
  /** 固定为链上订单托管路径；保留字段便于后续 API 契约扩展 */
  deliveryArchetype: MerchantDeliveryArchetype;
  agreeEscrowCopy: boolean;
};

function emptyDraft(): MerchantStudioDraft {
  return {
    title: "",
    subtitle: "",
    category: "dining",
    city: "",
    countryIso: "",
    coverPreviewUrl: null,
    coverFileName: null,
    videoPreviewUrl: null,
    videoFileName: null,
    videoUrl: "",
    highlightsText: "",
    description: "",
    priceUsdc: "",
    deliveryArchetype: "escrow_order",
    agreeEscrowCopy: false,
  };
}

const labelClass = "block text-small font-medium text-white mb-1";
const inputClass =
  "w-full rounded-[var(--radius-sm)] border border-white/25 bg-white/5 px-3 py-2 text-small text-white placeholder-white/50 focus:outline-none focus-visible:border-travel-400 focus-visible:ring-2 focus-visible:ring-travel-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-800 backdrop-blur-sm";
const descClass = "text-small text-white/80 mt-0.5";

export type MerchantStudioDraftSavedMeta = {
  /** 已成功同步为社区笔记时带回，供子站列表临时置顶链到 `/community/post/:id` */
  communityPostId?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  /** 保存成功后回调；`communityPostId` 存在表示已写入社区动态 */
  onDraftSaved?: (draft: MerchantStudioDraft, meta?: MerchantStudioDraftSavedMeta) => void;
};

/**
 * 商家橱窗 **Showcase studio**（橱窗工作台）：与旅行预约 `CustomItineraryModal` 同构的玻璃弹窗骨架。
 * 媒体仅通过显式按钮触发系统文件选择器（`input[type=file]` 使用 `sr-only`）；结算说明与链上「订单 + Escrow」一致。
 * 保存草稿：**`POST …/market/provider/listings/drafts`** → PostgreSQL `market_listing_drafts`（已配置 `DATABASE_URL` 时）；浏览器 **localStorage** 仅作离线备份。「发布至公开展示目录」走 **`POST …/market/provider/listings`**（`market_listings`）。
 */
export default function MerchantShowcaseStudioModal({ open, onClose, onDraftSaved }: Props) {
  const { t, locale } = useTranslation();
  const [form, setForm] = useState<MerchantStudioDraft>(emptyDraft);
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

  const baselineFingerprint = useMemo(() => merchantStudioDraftFingerprint(emptyDraft()), []);
  const isDirty = useMemo(
    () => merchantStudioDraftFingerprint(form) !== baselineFingerprint,
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
    trackMarketEvent("market_merchant_studio_open", {});
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
    () =>
      [
        { value: "hotel" as const, labelKey: "market_subsite_m_cat_hotel" },
        { value: "dining" as const, labelKey: "market_subsite_m_cat_dining" },
        { value: "attraction" as const, labelKey: "market_subsite_m_cat_attraction" },
        { value: "experience" as const, labelKey: "market_subsite_m_cat_experience" },
      ] as const,
    [],
  );

  /** 邮箱登录等会写 localStorage 并派发 `traveltrust:auth-change`；须 bump 否则 `publishGate` 仍按打开弹窗瞬间的会话快照计算。 */
  const [authEpoch, setAuthEpoch] = useState(0);
  useEffect(() => {
    const onAuth = () => setAuthEpoch((n) => n + 1);
    if (typeof window === "undefined") return;
    window.addEventListener("traveltrust:auth-change", onAuth);
    return () => window.removeEventListener("traveltrust:auth-change", onAuth);
  }, []);

  const publishGate = useMemo(() => {
    void authEpoch;
    const title = form.title.trim();
    const price = Number(form.priceUsdc);
    const iso = form.countryIso.trim().toUpperCase();
    const formOk =
      Boolean(title) &&
      Number.isFinite(price) &&
      price > 0 &&
      price <= 999999 &&
      form.agreeEscrowCopy &&
      (!iso || isAllowedProductIso3166(iso));
    const sessionOk = hasCommunityPublishAuth();
    return {
      canPublish: formOk && sessionOk,
      sessionOk,
      formOk,
      titleWhenDisabled: !sessionOk
        ? t("market_studio_publish_login_hint")
        : !formOk
          ? t("market_studio_publish_form_incomplete_hint")
          : "",
    };
  }, [form, t, authEpoch]);

  const runPersistAndSync = useCallback(async () => {
    setSubmitError(null);
    const title = form.title.trim();
    const price = Number(form.priceUsdc);
    if (!title) {
      setSubmitError(t("market_merchantStudio_err_title"));
      return;
    }
    if (!Number.isFinite(price) || price <= 0 || price > 999999) {
      setSubmitError(t("market_merchantStudio_err_price"));
      return;
    }
    if (!form.agreeEscrowCopy) {
      setSubmitError(t("market_merchantStudio_err_escrow"));
      return;
    }
    const iso = form.countryIso.trim().toUpperCase();
    if (iso && !isAllowedProductIso3166(iso)) {
      setSubmitError(t("market_merchantStudio_err_country"));
      return;
    }
    setSaving(true);
    try {
      const persistSource: MerchantStudioDraftPersistSource = {
        title: form.title,
        subtitle: form.subtitle,
        category: form.category,
        city: form.city,
        countryIso: form.countryIso,
        coverFileName: form.coverFileName,
        videoFileName: form.videoFileName,
        videoUrl: form.videoUrl,
        highlightsText: form.highlightsText,
        description: form.description,
        priceUsdc: form.priceUsdc,
        deliveryArchetype: form.deliveryArchetype,
        agreeEscrowCopy: form.agreeEscrowCopy,
      };
      const { draft_id } = await persistMerchantShowcaseStudioDraft(persistSource);
      let publishedListingId: string | undefined;
      if (publishGate.canPublish) {
        try {
          const cat = await publishMerchantShowcaseStudioCatalog(persistSource);
          publishedListingId = cat.listing_id;
        } catch (err) {
          if (typeof window !== "undefined") {
            console.error("Merchant showcase catalog publish:", err);
          }
          setSubmitError(t("market_studio_catalog_publish_fail"));
          return;
        }
      }
      let communityPostId: string | undefined;
      if (hasCommunityPublishAuth()) {
        try {
          const { postId } = await publishMerchantShowcaseCommunityPost(persistSource, draft_id, {
            marketListingId: publishedListingId,
          });
          communityPostId = postId;
          trackMarketEvent("market_merchant_studio_community_sync", { draft_id, post_id: postId });
        } catch (err) {
          if (typeof window !== "undefined") {
            console.error("Merchant showcase community sync:", err);
          }
          setSubmitError(t("market_studio_community_sync_fail"));
          return;
        }
      }
      trackMarketEvent("market_merchant_studio_draft_save", {
        category: form.category,
        deliveryArchetype: form.deliveryArchetype,
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
        className="relative w-full max-w-2xl rounded-[var(--radius-lg)] border border-white/25 bg-white/5 backdrop-blur-md shadow-strong overflow-hidden max-h-[90vh] flex flex-col"
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="border-b border-white/15 px-4 py-3 sm:px-6 shrink-0 flex items-start justify-between gap-3">
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
              className={`${touchTargetLink44Classes} ${travelFocusRingCoreOffset2Classes} inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/15`}
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

            <p className="rounded-[var(--radius-sm)] border border-ref-cyan/35 bg-ref-cyan/10 px-3 py-2 text-meta text-cyan-50/95">
              {t("market_studio_demo_banner")}
            </p>

            <section className="space-y-3" aria-labelledby="m-studio-basic">
              <h3 id="m-studio-basic" className="text-small font-semibold uppercase tracking-wide text-ref-cyan/90">
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
                        form.category === opt.value
                          ? "border-ref-cyan/50 bg-ref-cyan/20 text-white"
                          : "border-white/20 bg-white/5 text-white/85 hover:bg-white/10"
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

            <section className="space-y-3" aria-labelledby="m-studio-media">
              <h3 id="m-studio-media" className="text-small font-semibold uppercase tracking-wide text-ref-cyan/90">
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
                  className={`${touchTargetLink44Classes} ${travelFocusRingCoreOffset2Classes} inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-white/20 bg-white/[0.08] px-4 py-2 text-small font-medium text-white hover:bg-white/12`}
                >
                  {t("market_merchantStudio_pick_cover")}
                </button>
                {coverTooBig ? <p className="mt-1 text-meta text-white/95">{t("market_merchantStudio_cover_too_big")}</p> : null}
                {form.coverFileName ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-meta text-slate-400 truncate max-w-full">{form.coverFileName}</span>
                    <button type="button" onClick={clearCover} className={`${touchTargetLink44Classes} text-meta text-cyan-200 underline`}>
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
                  className={`${touchTargetLink44Classes} ${travelFocusRingCoreOffset2Classes} inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-white/20 bg-white/[0.08] px-4 py-2 text-small font-medium text-white hover:bg-white/12`}
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
                      className="max-h-48 w-full rounded-[var(--radius-md)] border border-white/15 bg-black/40 object-contain"
                      controls
                      playsInline
                      muted
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      {form.videoFileName ? (
                        <span className="text-meta text-slate-400 truncate max-w-full">{form.videoFileName}</span>
                      ) : null}
                      <button type="button" onClick={clearVideo} className={`${touchTargetLink44Classes} text-meta text-cyan-200 underline`}>
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
              <h3 id="m-studio-copy" className="text-small font-semibold uppercase tracking-wide text-ref-cyan/90">
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
              <h3 id="m-studio-price" className="text-small font-semibold uppercase tracking-wide text-ref-cyan/90">
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
              className="rounded-[var(--radius-md)] border border-white/12 bg-ink-900/35 p-4 space-y-2"
              aria-labelledby="m-studio-escrow-path"
            >
              <h3 id="m-studio-escrow-path" className="text-small font-semibold uppercase tracking-wide text-ref-cyan/90">
                {t("market_merchantStudio_section_escrow_path")}
              </h3>
              <p className="text-meta leading-relaxed text-slate-300/95">{t("market_merchantStudio_escrow_path_body")}</p>
            </section>

            <section className="rounded-[var(--radius-md)] border border-white/12 bg-ink-900/40 p-4 space-y-3">
              <label className="flex min-h-[44px] cursor-pointer items-start gap-3 text-small text-white/90">
                <input
                  type="checkbox"
                  checked={form.agreeEscrowCopy}
                  onChange={(e) => setForm((f) => ({ ...f, agreeEscrowCopy: e.target.checked }))}
                  className="mt-1 rounded border-white/30 text-travel-500 bg-white/5"
                />
                <span>{t("market_merchantStudio_escrow_ack")}</span>
              </label>
            </section>
          </div>

          <div className="shrink-0 border-t border-white/10 bg-ink-900/40">
            {!publishGate.canPublish ? (
              <p
                className="border-b border-warning/20 px-4 py-2.5 sm:px-6 text-[0.7rem] leading-snug text-white/95"
                role="status"
              >
                {!publishGate.sessionOk
                  ? t("market_studio_publish_footer_strip_no_session")
                  : t("market_studio_publish_footer_strip_form")}
              </p>
            ) : null}
            <div className="flex flex-col-reverse gap-2 px-4 py-3 sm:flex-row sm:flex-wrap sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={requestClose}
              className={`${touchTargetLink44Classes} ${travelFocusRingCoreOffset2Classes} w-full sm:w-auto rounded-[var(--radius-sm)] border border-white/20 bg-white/[0.06] px-4 py-2.5 text-small font-medium text-slate-100 hover:bg-white/10`}
            >
              {t("market_merchantStudio_cancel")}
            </button>
            <button
              type="button"
              disabled={saving || !publishGate.canPublish}
              title={
                saving
                  ? t("market_merchantStudio_saving")
                  : !publishGate.canPublish
                    ? publishGate.titleWhenDisabled || t("market_studio_publish_login_hint")
                    : t("market_studio_publish_tooltip")
              }
              onClick={() => void runPersistAndSync()}
              className={`${touchTargetLink44Classes} ${travelFocusRingCoreOffset2Classes} w-full sm:w-auto rounded-[var(--radius-sm)] border px-4 py-2.5 text-small font-medium ${
                saving || !publishGate.canPublish
                  ? "cursor-not-allowed border-white/15 bg-white/[0.04] text-white/45"
                  : "border-ref-teal/50 bg-ref-teal/15 text-white hover:bg-ref-teal/25 motion-sub"
              }`}
            >
              {t("market_studio_publish")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`${touchTargetLink44Classes} ${travelFocusRingCoreOffset2Classes} w-full sm:w-auto rounded-[var(--radius-sm)] bg-gradient-to-r from-ref-teal via-ref-cyan to-ref-teal px-5 py-2.5 text-small font-semibold text-white shadow-[0_0_20px_-6px_rgba(35,206,217,0.35)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {saving ? t("market_merchantStudio_saving") : t("market_merchantStudio_save_draft")}
            </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
