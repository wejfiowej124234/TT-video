"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
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
import { isAllowedProductIso3166 } from "@/lib/productCountries";
import { trackMarketEvent } from "@/lib/analytics";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { fetchMerchantPublishEligibility } from "@/lib/provider/merchantPublishEligibility";
import { merchantCatalogPublishBlockedKeys } from "@/lib/publishActionBlockedKeys";
import {
  MARKET_STUDIO_COVER_MAX_BYTES as COVER_MAX_BYTES,
  MARKET_STUDIO_PROMO_VIDEO_MAX_BYTES as PROMO_VIDEO_MAX_BYTES,
} from "@/lib/marketStudioMediaLimits";
import {
  emptyMerchantStudioDraft,
  merchantShowcaseCategoryOptions,
  type MerchantStudioDraft,
  type MerchantStudioDraftSavedMeta,
} from "./merchantShowcaseStudioModel";

export type UseMerchantShowcaseStudioModalArgs = {
  open: boolean;
  onClose: () => void;
  onDraftSaved?: (draft: MerchantStudioDraft, meta?: MerchantStudioDraftSavedMeta) => void;
};

export function useMerchantShowcaseStudioModal({ open, onClose, onDraftSaved }: UseMerchantShowcaseStudioModalArgs) {
  const { t, locale } = useTranslation();
  const [form, setForm] = useState<MerchantStudioDraft>(emptyMerchantStudioDraft);
  const [coverTooBig, setCoverTooBig] = useState(false);
  const [videoTooBig, setVideoTooBig] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [merchantGate, setMerchantGate] = useState<Awaited<
    ReturnType<typeof fetchMerchantPublishEligibility>
  > | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const titleId = useId();
  const descId = useId();
  const coverLabelId = useId();
  const videoLabelId = useId();

  const baselineFingerprint = useMemo(() => merchantStudioDraftFingerprint(emptyMerchantStudioDraft()), []);
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
        return emptyMerchantStudioDraft();
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

  const categoryOptions = useMemo(() => merchantShowcaseCategoryOptions(), []);

  /** 邮箱登录等会写 localStorage 并派发 `traveltrust:auth-change`；须 bump 否则 `publishGate` 仍按打开弹窗瞬间的会话快照计算。 */
  const [authEpoch, setAuthEpoch] = useState(0);
  useEffect(() => {
    const onAuth = () => setAuthEpoch((n) => n + 1);
    if (typeof window === "undefined") return;
    window.addEventListener("traveltrust:auth-change", onAuth);
    return () => window.removeEventListener("traveltrust:auth-change", onAuth);
  }, []);

  useEffect(() => {
    if (!open) return;
    void fetchMerchantPublishEligibility().then(setMerchantGate);
  }, [open, authEpoch]);

  const publishBlockedKeys = useMemo(() => {
    void authEpoch;
    return merchantCatalogPublishBlockedKeys(form, hasCommunityPublishAuth(), merchantGate ?? undefined);
  }, [form, authEpoch, merchantGate]);

  const canPublish = publishBlockedKeys.length === 0;

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
      if (canPublish) {
        try {
          const cat = await publishMerchantShowcaseStudioCatalog(persistSource);
          publishedListingId = cat.listing_id;
        } catch (err) {
          if (typeof window !== "undefined") {
            console.error("Merchant showcase catalog publish:", err);
          }
          setSubmitError(mapApiReadError(err, t, "market_studio_catalog_publish_fail"));
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
          setSubmitError(mapApiReadError(err, t, "market_studio_community_sync_fail"));
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
    } catch (err) {
      setSubmitError(mapApiReadError(err, t, "market_studio_draft_api_fail"));
    } finally {
      setSaving(false);
    }
  }, [form, onClose, onDraftSaved, canPublish, t]);

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    await runPersistAndSync();
  };

  return {
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
    runPersistAndSync,
    handleSaveDraft,
    onCoverPick,
    clearCover,
    onVideoPick,
    clearVideo,
    t,
    locale,
  };
}
