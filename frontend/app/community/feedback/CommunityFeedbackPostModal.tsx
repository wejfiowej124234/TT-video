"use client";
import { TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";

import type { FormEvent, RefObject } from "react";
import NextImage from "next/image";
import {
  communityCyanPillFocus,
  communityPublishFabFocus,
  communitySlatePillFocus,
} from "@/lib/communityA11yFocus";
import {
  communityFeedbackModalPortalRootClass,
  communityFeedbackModalScrimClass,
} from "@/components/market/marketStudioModalLayout";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaNextImageUnoptimized,
} from "@/lib/communityMediaClientUrl";
import type { FeedbackMediaItem } from "@/lib/communityFeedbackDisplay";
import { FEEDBACK_CATEGORIES, MAX_MEDIA } from "./communityFeedbackPageConstants";

export function CommunityFeedbackPostModal({
  t,
  feedbackModalTitleId,
  feedbackModalDescId,
  feedbackMediaErrId,
  feedbackContentErrId,
  feedbackFormErrId,
  feedbackCategoryId,
  feedbackContentId,
  modalFocusRef,
  photoInputRef,
  videoInputRef,
  handleSubmit,
  feedbackFieldMessages,
  feedbackFormError,
  category,
  setCategory,
  content,
  setContent,
  clearFeedbackFormErrors,
  mediaPreviews,
  mediaError,
  addMediaFiles,
  submitting,
}: {
  t: (key: string) => string;
  feedbackModalTitleId: string;
  feedbackModalDescId: string;
  feedbackMediaErrId: string;
  feedbackContentErrId: string;
  feedbackFormErrId: string;
  feedbackCategoryId: string;
  feedbackContentId: string;
  modalFocusRef: RefObject<HTMLSelectElement | null>;
  photoInputRef: RefObject<HTMLInputElement | null>;
  videoInputRef: RefObject<HTMLInputElement | null>;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void | Promise<void>;
  feedbackFieldMessages: Record<string, string> | null;
  feedbackFormError: string | null;
  category: string;
  setCategory: (v: string) => void;
  content: string;
  setContent: (v: string) => void;
  clearFeedbackFormErrors: () => void;
  mediaPreviews: FeedbackMediaItem[];
  mediaError: string | null;
  addMediaFiles: (files: FileList | null) => void;
  submitting: boolean;
}) {
  return (
    <div
      className={communityFeedbackModalPortalRootClass}
      role="dialog"
      aria-modal="true"
      aria-labelledby={feedbackModalTitleId}
      aria-describedby={feedbackModalDescId}
    >
      <div className={communityFeedbackModalScrimClass} aria-hidden />
      <div className="relative z-10 w-full max-w-md rounded-[var(--radius-xl)] border border-ref-sun/28 bg-ink-900/95 backdrop-blur-md p-6 shadow-scifi-modal">
        <h3 id={feedbackModalTitleId} className="text-body font-semibold text-ref-sun/90 mb-4">{t("community_feedback_post")}</h3>
        <p id={feedbackModalDescId} className="sr-only">{t("community_feedback_subtitle")}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <button
            type="submit"
            name="fbSubmit"
            className="sr-only absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0"
            tabIndex={-1}
            aria-hidden
          >
            {t("community_feedback_submit")}
          </button>
          {feedbackFieldMessages?.media_urls ? (
            <div
              id={feedbackMediaErrId}
              role="alert"
              className="rounded-[var(--radius-md)] border border-danger/50 bg-danger/20 px-3 py-2 text-small text-danger/95"
            >
              {feedbackFieldMessages.media_urls}
            </div>
          ) : null}
          {feedbackFieldMessages?.content ? (
            <div
              id={feedbackContentErrId}
              role="alert"
              className="rounded-[var(--radius-md)] border border-danger/50 bg-danger/20 px-3 py-2 text-small text-danger/95"
            >
              {feedbackFieldMessages.content}
            </div>
          ) : null}
          {!feedbackFieldMessages?.content &&
          !feedbackFieldMessages?.media_urls &&
          feedbackFormError ? (
            <div
              id={feedbackFormErrId}
              role="alert"
              className="rounded-[var(--radius-md)] border border-warning/50 bg-warning/15 px-3 py-2 text-small text-warning/95"
            >
              {feedbackFormError}
            </div>
          ) : null}
          <div>
            <label htmlFor={feedbackCategoryId} className="block text-meta text-slate-300 mb-1.5">
              {t("community_feedback_category_label")}
            </label>
            <select
              ref={modalFocusRef}
              id={feedbackCategoryId}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="inline-flex w-full min-h-[44px] items-center justify-start rounded-[var(--radius-md)] border border-slate-500/60 bg-ink-800/80 px-3 py-2 text-small text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
              aria-required
            >
              {FEEDBACK_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {t(c.labelKey)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={feedbackContentId} className="block text-meta text-slate-300 mb-1.5">
              {t("community_feedback_content_label")}
            </label>
            <textarea
              id={feedbackContentId}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (feedbackFieldMessages?.content || feedbackFormError) clearFeedbackFormErrors();
              }}
              placeholder={t("community_feedback_content_placeholder")}
              rows={4}
              required
              aria-invalid={!!feedbackFieldMessages?.content}
              aria-errormessage={
                feedbackFieldMessages?.content
                  ? feedbackContentErrId
                  : feedbackFormError
                    ? feedbackFormErrId
                    : undefined
              }
              className={`w-full rounded-[var(--radius-md)] border bg-ink-800/80 px-3 py-2 text-small text-slate-200 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 resize-y min-h-[80px] focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 ${
                feedbackFieldMessages?.content
                  ? "border-danger/70 focus-visible:ring-danger/50"
                  : "border-slate-500/60 focus-visible:ring-ref-sun/50"
              }`}
            />
          </div>
          <div>
            <span className="block text-meta text-slate-300 mb-1.5">{t("community_feedback_media_label")}</span>
            <p className="text-meta text-slate-400 mb-2">{t("community_feedback_media_limit")}</p>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              aria-label={t("community_feedback_upload_photo")}
              onChange={(e) => { addMediaFiles(e.target.files); e.target.value = ""; }}
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="sr-only"
              aria-label={t("community_feedback_upload_video")}
              onChange={(e) => { addMediaFiles(e.target.files); e.target.value = ""; }}
            />
            <div className="flex flex-wrap gap-2 mb-2">
              <button
                type="submit"
                name="fbPick"
                value="photo"
                disabled={mediaPreviews.length >= MAX_MEDIA}
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-slate-500/60 bg-ink-800/60 px-3 py-1.5 text-meta text-slate-300 hover:bg-ink-700/60 disabled:opacity-50 ${communitySlatePillFocus}`}
              >
                {t("community_feedback_upload_photo")}
              </button>
              <button
                type="submit"
                name="fbPick"
                value="video"
                disabled={mediaPreviews.length >= MAX_MEDIA}
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-slate-500/60 bg-ink-800/60 px-3 py-1.5 text-meta text-slate-300 hover:bg-ink-700/60 disabled:opacity-50 ${communitySlatePillFocus}`}
              >
                {t("community_feedback_upload_video")}
              </button>
            </div>
            {mediaError ? (
              <p className="text-meta text-danger/95 mb-2" role="alert">
                {mediaError}
              </p>
            ) : null}
            {mediaPreviews.length > 0 && (
              <ul className="flex flex-wrap gap-2 overflow-x-auto pb-1" role="list">
                {mediaPreviews.map((m, i) => (
                  <li key={i} className="relative shrink-0 w-20 h-20 rounded-[var(--radius-md)] overflow-hidden border border-slate-500/50 bg-ink-800">
                    {m.type === "image" ? (
                      <NextImage
                        src={communityMediaAbsoluteUrlForRender(m.url)}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="80px"
                        unoptimized={communityMediaNextImageUnoptimized(
                          communityMediaAbsoluteUrlForRender(m.url)
                        )}
                      />
                    ) : (
                      <video
                        src={communityMediaAbsoluteUrlForRender(m.url)}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    )}
                    <button
                      type="submit"
                      name="fbRemoveMedia"
                      value={String(i)}
                      className="absolute top-0 right-0 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-bl-[var(--radius-md)] bg-black/60 text-white text-body font-medium hover:bg-black/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ref-sun/55"
                      aria-label={t("common_close")}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              type="submit"
              name="fbClose"
              className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-slate-500/60 bg-ink-800/60 px-4 py-2 text-small text-slate-300 hover:bg-ink-700/60 ${communitySlatePillFocus}`}
            >
              {t("common_close")}
            </button>
            <button
              type="submit"
              name="fbSubmit"
              disabled={submitting || !content.trim()}
              aria-busy={submitting ? true : undefined}
              className={`inline-flex min-h-[44px] items-center justify-center ${TT_COMMUNITY_PAGE_L5.primaryCtaFilled} ${communityCyanPillFocus}`}
            >
              {submitting ? t("common_submitting") : t("community_feedback_submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
