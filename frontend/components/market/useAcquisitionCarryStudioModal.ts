"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import {
  acquisitionDraftFromLocalPayload,
  acquisitionStudioDraftFingerprint,
  persistAcquisitionCarryStudioDraft,
  publishAcquisitionCarryStudioCatalog,
  readAcquisitionStudioLocalBackup,
} from "@/lib/marketStudioDraft";
import type { AcquisitionStudioDraftPersistSource } from "@/lib/marketStudioDraft";
import {
  hasCommunityPublishAuth,
  publishAcquisitionCarryCommunityPost,
} from "@/lib/marketProductCommunityPublish";
import { trackMarketEvent } from "@/lib/analytics";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { acquisitionCatalogPublishBlockedKeys } from "@/lib/publishActionBlockedKeys";
import {
  MARKET_STUDIO_COVER_MAX_BYTES as COVER_MAX_BYTES,
  MARKET_STUDIO_PROMO_VIDEO_MAX_BYTES as PROMO_VIDEO_MAX_BYTES,
} from "@/lib/marketStudioMediaLimits";
import {
  acquisitionCategoryOptions,
  emptyAcquisitionStudioDraft,
  type AcquisitionStudioDraft,
  type AcquisitionStudioDraftSavedMeta,
} from "./acquisitionCarryStudioModel";
import type { AcquisitionCategorySlug } from "@/lib/marketSubsiteDemo";
import { ACQUISITION_CATEGORY_SLUGS } from "@/lib/marketSubsiteFilters";

export type UseAcquisitionCarryStudioModalArgs = {
  open: boolean;
  onClose: () => void;
  onDraftSaved?: (draft: AcquisitionStudioDraft, meta?: AcquisitionStudioDraftSavedMeta) => void;
};

function hydrateAcquisitionFormFromBackup(): AcquisitionStudioDraft {
  const backup = readAcquisitionStudioLocalBackup();
  if (!backup) return emptyAcquisitionStudioDraft();
  const src = acquisitionDraftFromLocalPayload(backup.payload);
  const cat = src.category as AcquisitionCategorySlug;
  return {
    ...emptyAcquisitionStudioDraft(),
    title: src.title,
    summary: src.summary,
    supplyOrigin: src.supplyOrigin,
    receiptHandoff: src.receiptHandoff,
    category: ACQUISITION_CATEGORY_SLUGS.includes(cat) ? cat : "luxury",
    destinationCountryIso: src.destinationCountryIso,
    bountyMinUsdc: src.bountyMinUsdc,
    bountyMaxUsdc: src.bountyMaxUsdc,
    deadlineNote: src.deadlineNote,
    coverFileName: src.coverFileName,
    videoFileName: src.videoFileName,
    videoUrl: src.videoUrl,
    highlightsText: src.highlightsText,
    description: src.description,
    inspectionStandard: src.inspectionStandard,
    authenticity: src.authenticity,
    condition: src.condition,
    rejections: src.rejections,
    handoff: src.handoff,
    agreeEscrowCopy: src.agreeEscrowCopy,
  };
}

export function useAcquisitionCarryStudioModal({ open, onClose, onDraftSaved }: UseAcquisitionCarryStudioModalArgs) {
  const { t, locale } = useTranslation();
  const [form, setForm] = useState<AcquisitionStudioDraft>(emptyAcquisitionStudioDraft);
  const [coverTooBig, setCoverTooBig] = useState(false);
  const [videoTooBig, setVideoTooBig] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const titleId = useId();
  const descId = useId();
  const coverLabelId = useId();
  const videoLabelId = useId();

  const baselineFingerprint = useMemo(() => acquisitionStudioDraftFingerprint(emptyAcquisitionStudioDraft()), []);
  const isDirty = useMemo(
    () => acquisitionStudioDraftFingerprint(form) !== baselineFingerprint,
    [baselineFingerprint, form],
  );

  const requestClose = useCallback(() => {
    if (isDirty) {
      setDiscardConfirmOpen(true);
      return;
    }
    onClose();
  }, [isDirty, onClose]);

  const cancelDiscardConfirm = useCallback(() => {
    setDiscardConfirmOpen(false);
  }, []);

  const acceptDiscardConfirm = useCallback(() => {
    setDiscardConfirmOpen(false);
    onClose();
  }, [onClose]);

  const trapRef = useFocusTrap(open, requestClose);

  useEffect(() => {
    if (!open) {
      setDiscardConfirmOpen(false);
      setForm((prev) => {
        if (prev.coverPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(prev.coverPreviewUrl);
        if (prev.videoPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(prev.videoPreviewUrl);
        return emptyAcquisitionStudioDraft();
      });
      setCoverTooBig(false);
      setVideoTooBig(false);
      setSubmitError(null);
      setSaving(false);
      return;
    }
    setForm(hydrateAcquisitionFormFromBackup());
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

  const categoryOptions = useMemo(() => acquisitionCategoryOptions(), []);

  const [authEpoch, setAuthEpoch] = useState(0);
  useEffect(() => {
    const onAuth = () => setAuthEpoch((n) => n + 1);
    if (typeof window === "undefined") return;
    window.addEventListener("traveltrust:auth-change", onAuth);
    return () => window.removeEventListener("traveltrust:auth-change", onAuth);
  }, []);

  const publishBlockedKeys = useMemo(() => {
    void authEpoch;
    return acquisitionCatalogPublishBlockedKeys(form, hasCommunityPublishAuth());
  }, [form, authEpoch]);

  const canPublish = publishBlockedKeys.length === 0;

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
      if (canPublish) {
        try {
          const cat = await publishAcquisitionCarryStudioCatalog(persistSource);
          publishedListingId = cat.listing_id;
        } catch (err) {
          if (typeof window !== "undefined") {
            console.error("Acquisition catalog publish:", err);
          }
          setSubmitError(mapApiReadError(err, t, "market_studio_catalog_publish_fail"));
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
          setSubmitError(mapApiReadError(err, t, "market_studio_community_sync_fail"));
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
    discardConfirmOpen,
    cancelDiscardConfirm,
    acceptDiscardConfirm,
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
