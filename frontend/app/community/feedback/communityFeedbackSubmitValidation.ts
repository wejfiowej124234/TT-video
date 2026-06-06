import { interpretCommunityWriteError } from "@/lib/formatCommunityApiMessage";
import {
  feedbackMediaEmbeddedPolicyViolationCode,
  feedbackMediaItemHasAllowedClientScheme,
} from "@/lib/communityPostMediaEmbeddedUrlPolicy";
import { FEEDBACK_MEDIA_ITEM_MAX_UTF8_BYTES } from "@/lib/communityFeedbackMediaLimits";
import type { FeedbackMediaItem } from "@/lib/communityFeedbackDisplay";
import type { LocaleTranslateFn } from "@/lib/i18n";

export const COMMUNITY_FEEDBACK_SUBMIT_FAILED_I18N_KEY = "community_feedback_submit_failed";

export type FeedbackFormErrorState = {
  fieldMessages: Record<string, string> | null;
  formError: string | null;
};

export function feedbackFormStateFromWriteInterpretation(interpreted: {
  topMessage: string | null;
  fieldMessages: Record<string, string>;
}): FeedbackFormErrorState {
  const fm = Object.keys(interpreted.fieldMessages).length > 0 ? interpreted.fieldMessages : null;
  return {
    fieldMessages: fm,
    formError: fm?.content || fm?.media_urls ? null : interpreted.topMessage,
  };
}

export function interpretFeedbackSubmitWriteError(
  data: unknown,
  t: LocaleTranslateFn,
  fallbackKey: string = COMMUNITY_FEEDBACK_SUBMIT_FAILED_I18N_KEY
): FeedbackFormErrorState {
  const interpreted = interpretCommunityWriteError(data, t, fallbackKey);
  return feedbackFormStateFromWriteInterpretation(interpreted);
}

function syntheticMediaEnvelope(error: string): unknown {
  return {
    status: "error",
    error,
    message: error,
    errors: { media_urls: error },
  };
}

/** 与原先 `handleSubmit` 内联校验一致：`null` 表示通过。 */
export function validateFeedbackMediaPreviewsForSubmit(
  mediaPreviews: FeedbackMediaItem[],
  t: LocaleTranslateFn
): FeedbackFormErrorState | null {
  for (const m of mediaPreviews) {
    const u = m.url.trim();
    if (!u) continue;
    if (u.length > FEEDBACK_MEDIA_ITEM_MAX_UTF8_BYTES) {
      return interpretFeedbackSubmitWriteError(syntheticMediaEnvelope("feedback_media_too_large"), t);
    }
    if (!feedbackMediaItemHasAllowedClientScheme(u)) {
      return interpretFeedbackSubmitWriteError(syntheticMediaEnvelope("feedback_media_scheme"), t);
    }
  }
  const mediaViol = feedbackMediaEmbeddedPolicyViolationCode(mediaPreviews.map((m) => m.url));
  if (mediaViol) {
    return interpretFeedbackSubmitWriteError(syntheticMediaEnvelope(mediaViol), t);
  }
  return null;
}
