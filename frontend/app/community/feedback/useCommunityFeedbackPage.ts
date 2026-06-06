import { useState, useCallback, useId, useRef, type FormEvent } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { postFeedback } from "@/lib/apiClient/community";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { dedupeListById } from "@/lib/dedupeListById";
import { FEEDBACK_CATEGORIES } from "./communityFeedbackPageConstants";
import { useCommunityFeedbackRemoteList } from "./useCommunityFeedbackRemoteList";
import type { FeedbackItem } from "./communityFeedbackPageModel";
import { useCommunityFeedbackPageToast } from "./useCommunityFeedbackPageToast";
import { useCommunityFeedbackPageMedia } from "./useCommunityFeedbackPageMedia";
import {
  COMMUNITY_FEEDBACK_SUBMIT_FAILED_I18N_KEY,
  interpretFeedbackSubmitWriteError,
  validateFeedbackMediaPreviewsForSubmit,
} from "./communityFeedbackSubmitValidation";
import { buildLocalFeedbackDraftItem } from "./communityFeedbackLocalDraftItem";
import { useCommunityFeedbackPageModalEffects } from "./useCommunityFeedbackPageModalEffects";

export function useCommunityFeedbackPage() {
  const { t } = useTranslation();
  const {
    list,
    setList,
    serverListSynced,
    listFetchError,
    hydrated,
    retryFetch,
  } = useCommunityFeedbackRemoteList(t);
  const { feedbackToast, showFeedbackToast, dismissFeedbackToast } = useCommunityFeedbackPageToast();
  const {
    mediaPreviews,
    mediaError,
    photoInputRef,
    videoInputRef,
    addMediaFiles,
    removeMedia,
    resetMedia,
  } = useCommunityFeedbackPageMedia(t);

  const feedbackListHeadingId = useId();
  const feedbackModalTitleId = useId();
  const feedbackModalDescId = useId();
  const feedbackMediaErrId = useId();
  const feedbackContentErrId = useId();
  const feedbackFormErrId = useId();
  const feedbackCategoryId = useId();
  const feedbackContentId = useId();
  const [postOpen, setPostOpen] = useState(false);
  const [category, setCategory] = useState<string>(FEEDBACK_CATEGORIES[0].value);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackFormError, setFeedbackFormError] = useState<string | null>(null);
  const [feedbackFieldMessages, setFeedbackFieldMessages] = useState<Record<string, string> | null>(null);
  const modalFocusRef = useRef<HTMLSelectElement>(null);

  const clearFeedbackFormErrors = useCallback(() => {
    setFeedbackFormError(null);
    setFeedbackFieldMessages(null);
  }, []);

  useCommunityFeedbackPageModalEffects({
    postOpen,
    setPostOpen,
    setContent,
    resetMedia,
    clearFeedbackFormErrors,
    modalFocusRef,
  });

  const saveOfflineDraft = useCallback(() => {
    const trimmed = content.trim();
    if (!trimmed) return;
    dismissFeedbackToast();
    const item = buildLocalFeedbackDraftItem(category, trimmed, mediaPreviews);
    setList((prev) => dedupeListById([item, ...prev], (x) => x.id));
    setContent("");
    setCategory(FEEDBACK_CATEGORIES[0].value);
    resetMedia();
    setPostOpen(false);
    clearFeedbackFormErrors();
    showFeedbackToast("community_feedback_offline_saved");
  }, [
    category,
    content,
    mediaPreviews,
    dismissFeedbackToast,
    showFeedbackToast,
    clearFeedbackFormErrors,
    setList,
    resetMedia,
  ]);

  const handleClose = useCallback(() => {
    setPostOpen(false);
    setContent("");
    resetMedia();
    clearFeedbackFormErrors();
  }, [clearFeedbackFormErrors, resetMedia]);

  const applySubmitErrorState = useCallback((state: { fieldMessages: Record<string, string> | null; formError: string | null }) => {
    setFeedbackFieldMessages(state.fieldMessages);
    setFeedbackFormError(state.formError);
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const sub = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
      if (sub?.name === "fbPick") {
        if (sub.value === "photo") {
          photoInputRef.current?.click();
          return;
        }
        if (sub.value === "video") {
          videoInputRef.current?.click();
          return;
        }
      }
      if (sub?.name === "fbRemoveMedia") {
        const idx = Number.parseInt(sub.value, 10);
        if (!Number.isNaN(idx)) removeMedia(idx);
        return;
      }
      if (sub?.name === "fbClose") {
        handleClose();
        return;
      }
      const trimmed = content.trim();
      if (!trimmed) return;
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        saveOfflineDraft();
        return;
      }
      const mediaInvalid = validateFeedbackMediaPreviewsForSubmit(mediaPreviews, t);
      if (mediaInvalid) {
        dismissFeedbackToast();
        applySubmitErrorState(mediaInvalid);
        return;
      }
      dismissFeedbackToast();
      setSubmitting(true);
      clearFeedbackFormErrors();
      try {
        const res = await postFeedback({
          category,
          content: trimmed,
          ...(mediaPreviews.length > 0 ? { media_urls: mediaPreviews.map((m) => m.url) } : {}),
        });
        if (res?.status === "ok" && res.id) {
          const item: FeedbackItem = {
            id: res.id,
            category,
            content: trimmed,
            status: "open",
            created_at: new Date().toISOString(),
            local: false,
            media: mediaPreviews.length ? [...mediaPreviews] : undefined,
          };
          setList((prev) => dedupeListById([item, ...prev], (x) => x.id));
          setContent("");
          setCategory(FEEDBACK_CATEGORIES[0].value);
          resetMedia();
          setPostOpen(false);
          clearFeedbackFormErrors();
          showFeedbackToast("community_feedback_submit_ok");
          return;
        }
        if (res?.status === "error") {
          if (typeof window !== "undefined") {
            console.error("CommunityFeedbackPage postFeedback not ok:", res);
          }
          dismissFeedbackToast();
          applySubmitErrorState(interpretFeedbackSubmitWriteError(res, t));
          return;
        }
        if (typeof window !== "undefined") {
          console.error("CommunityFeedbackPage postFeedback unexpected:", res);
        }
        dismissFeedbackToast();
        setFeedbackFormError(t(COMMUNITY_FEEDBACK_SUBMIT_FAILED_I18N_KEY));
      } catch (err) {
        if (typeof window !== "undefined") {
          console.error("CommunityFeedbackPage postFeedback:", err);
        }
        dismissFeedbackToast();
        setFeedbackFormError(mapApiReadError(err, t, COMMUNITY_FEEDBACK_SUBMIT_FAILED_I18N_KEY));
      } finally {
        setSubmitting(false);
      }
    },
    [
      applySubmitErrorState,
      category,
      clearFeedbackFormErrors,
      content,
      dismissFeedbackToast,
      handleClose,
      mediaPreviews,
      photoInputRef,
      removeMedia,
      resetMedia,
      saveOfflineDraft,
      setList,
      showFeedbackToast,
      t,
      videoInputRef,
    ]
  );

  return {
    t,
    list,
    serverListSynced,
    listFetchError,
    hydrated,
    retryFetch,
    feedbackListHeadingId,
    feedbackModalTitleId,
    feedbackModalDescId,
    feedbackMediaErrId,
    feedbackContentErrId,
    feedbackFormErrId,
    feedbackCategoryId,
    feedbackContentId,
    postOpen,
    setPostOpen,
    category,
    setCategory,
    content,
    setContent,
    mediaPreviews,
    mediaError,
    submitting,
    feedbackFieldMessages,
    feedbackFormError,
    feedbackToast,
    modalFocusRef,
    photoInputRef,
    videoInputRef,
    handleSubmit,
    addMediaFiles,
    clearFeedbackFormErrors,
  };
}
