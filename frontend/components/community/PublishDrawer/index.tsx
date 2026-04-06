"use client";

import { useId, type FormEvent, type MutableRefObject, type Ref } from "react";
import Image from "next/image";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import {
  TYPES,
  MAX_CHARS,
  MAX_IMAGES,
  ACCEPT_IMAGE,
  ACCEPT_VIDEO,
  MAX_VIDEO_SIZE_MB,
  MAX_VIDEO_DURATION_SEC,
  MAX_FILE_SIZE_MB,
} from "./constants";
import { usePublishForm } from "./usePublishForm";
import type { PublishDrawerProps } from "./types";
import {
  communityAmberPillFocus,
  communityCardLinkFocus,
  communityPublishFabFocus,
  communityShellTabFocus,
  communitySlatePillFocus,
} from "@/lib/communityA11yFocus";

function mergeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (el: T | null) => {
    refs.forEach((r) => {
      if (typeof r === "function") (r as (el: T | null) => void)(el);
      else if (r) (r as MutableRefObject<T | null>).current = el;
    });
  };
}

/** 发布动态弹窗：多图/视频占位 + 文案，对齐小红书/INS；P0 多图选择、排序、删除、回显；45 useFocusTrap */
export function PublishDrawer({
  onClose,
  onSubmit,
  t,
  publishError,
  publishErrorMessage,
  publishFieldMessages,
  onRetryPublish,
}: PublishDrawerProps) {
  const form = usePublishForm({ onClose, onSubmit, t });
  const submit = () => void form.handleSubmit();
  const focusTrapRef = useFocusTrap(form.entered, onClose);
  const videoHintText = t("community_publish_video_hint")
    .replace(/\{\{mb\}\}/g, String(MAX_VIDEO_SIZE_MB))
    .replace(/\{\{sec\}\}/g, String(MAX_VIDEO_DURATION_SEC));
  const photoHintText = t("community_publish_media_hint").replace(/\{\{mb\}\}/g, String(MAX_FILE_SIZE_MB));
  const pf = publishFieldMessages ?? {};
  const bodyFieldErr = !!pf.body;
  const mediaFieldErr = !!pf.media_urls;
  const showGenericPublishError = !!(publishError && !bodyFieldErr && !mediaFieldErr);
  const mediaMissing =
    (form.type === "photo" && form.previewUrls.length === 0) ||
    (form.type === "video" && !form.videoPreviewUrl);
  const publishDisabled = !form.content.trim() || form.submitting || mediaMissing;

  const drawerTitleId = useId();
  const publishEntryHintId = useId();
  const publishFormErrorId = useId();
  const publishTypeLabelId = useId();
  const publishMediaFieldErrorId = useId();
  const publishVideoCoverUrlId = useId();
  const publishVideoCoverHintId = useId();
  const publishContentLabelId = useId();
  const publishBodyFieldErrorId = useId();
  const publishTopicsHintId = useId();
  const publishCharCountId = useId();
  const publishRequiredHintId = useId();

  return (
    <div
      className={`fixed top-16 left-0 right-0 bottom-0 z-[200] flex items-center justify-center p-4 overflow-auto transition-opacity duration-200 ease-out motion-reduce:opacity-100 ${form.entered ? "opacity-100" : "opacity-0"}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={drawerTitleId}
      aria-describedby={showGenericPublishError ? `${publishEntryHintId} ${publishFormErrorId}` : publishEntryHintId}
    >
      <div
        className="absolute inset-0 top-0 bottom-20 bg-slate-950/85 backdrop-blur-sm md:bottom-0 md:top-12"
        aria-hidden
        onClick={onClose}
      />

      <div
        ref={mergeRefs(form.containerRef, focusTrapRef)}
        onClick={(e) => e.stopPropagation()}
        className={`relative z-10 w-full max-w-2xl max-h-[calc(100vh-6rem)] rounded-[var(--radius-lg)] border-2 border-cyan-500/40 bg-slate-900 shadow-scifi-sheet flex flex-col overflow-hidden transition-all duration-200 ease-out ${form.entered ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-cyan-500/30 bg-slate-800/80 py-3 min-h-[52px] px-4 sm:px-5">
          <form
            className="inline"
            onSubmit={(e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              onClose();
            }}
          >
            <button
              ref={form.backButtonRef}
              type="submit"
              className={`flex items-center justify-center gap-2 rounded-[var(--radius-xl)] border border-cyan-400/60 bg-slate-800 px-3 sm:px-4 py-2 min-h-[44px] text-body font-medium text-cyan-200 hover:text-cyan-100 hover:bg-slate-700 motion-sub ${communitySlatePillFocus}`}
              aria-label={t("community_back_to_community")}
            >
              <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline">{t("community_back_to_community")}</span>
            </button>
          </form>
          <h2 id={drawerTitleId} className="text-body font-semibold text-cyan-200 absolute left-1/2 -translate-x-1/2 pointer-events-none">
            {t("community_publish_title")}
          </h2>
          <form
            className="inline shrink-0"
            onSubmit={(e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              onClose();
            }}
          >
            <button
              type="submit"
              className={`flex shrink-0 items-center justify-center min-w-[44px] min-h-[44px] w-11 h-11 rounded-full border border-slate-500/60 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white motion-sub ${communitySlatePillFocus}`}
              aria-label={t("community_close")}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </form>
        </header>

        {showGenericPublishError ? (
          <div id={publishFormErrorId} className="mx-4 mt-3 rounded-[var(--radius-md)] border border-warning/50 bg-warning/10 px-3 py-2 flex items-center justify-between gap-2" role="alert" aria-live="assertive">
            <p className="text-meta text-warning/95">{publishErrorMessage?.trim() || t("community_publish_failed")}</p>
            {onRetryPublish ? (
              <form
                className="inline shrink-0"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  onRetryPublish();
                }}
              >
                <button
                  type="submit"
                  aria-label={t("community_retry")}
                  className={`rounded px-2 py-1 text-meta font-medium text-warning/95 hover:bg-warning/20 motion-sub min-h-[44px] inline-flex items-center justify-center ${communityAmberPillFocus}`}
                >
                  {t("community_retry")}
                </button>
              </form>
            ) : null}
          </div>
        ) : null}

        {publishError && (bodyFieldErr || mediaFieldErr) && onRetryPublish ? (
          <div className="mx-4 mt-2 flex justify-end">
            <form
              className="inline"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                onRetryPublish();
              }}
            >
              <button
                type="submit"
                aria-label={t("community_retry")}
                className={`rounded-[var(--radius-md)] border border-slate-500/60 bg-slate-800/80 px-3 text-meta text-slate-300 hover:border-cyan-500/50 hover:text-cyan-100 motion-sub min-h-[44px] inline-flex items-center justify-center ${communitySlatePillFocus}`}
              >
                {t("community_retry")}
              </button>
            </form>
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto min-h-0" role="main" aria-label={t("community_publish_title")}>
          <div className="px-4 sm:px-5 pt-5 pb-6 space-y-5">
            <p id={publishEntryHintId} className="text-small text-slate-300" role="doc-subtitle">
              {t("community_publish_entry_hint")}
            </p>
            <section className="rounded-[var(--radius-xl)] border-2 border-cyan-500/30 bg-slate-800/60 px-4 py-4" aria-labelledby={publishTypeLabelId}>
              <label id={publishTypeLabelId} className="block text-small font-medium text-slate-300 mb-3">
                {t("community_publish_type")}
              </label>
              <div className="flex flex-wrap gap-2">
                {TYPES.map((tKey) => (
                  <form
                    key={tKey}
                    className="contents"
                    onSubmit={(e: FormEvent<HTMLFormElement>) => {
                      e.preventDefault();
                      form.setType(tKey);
                    }}
                  >
                    <button
                      type="submit"
                      className={`inline-flex items-center justify-center rounded-full border px-4 py-2.5 text-small font-medium motion-sub min-h-[44px] min-w-[44px] ${communityShellTabFocus} ${
                        form.type === tKey
                          ? "border-cyan-400/70 bg-cyan-500/25 text-cyan-200 shadow-scifi-glow"
                          : "border-slate-500/60 bg-slate-700/40 text-slate-300 hover:text-slate-200 hover:border-slate-400/50"
                      }`}
                    >
                      {t(`community_type_${tKey}`)}
                    </button>
                  </form>
                ))}
              </div>
            </section>

            {form.type === "photo" && (
              <section
                role="group"
                aria-label={t("community_add_photo")}
                className={`rounded-[var(--radius-xl)] border bg-slate-800/40 px-4 py-4 ${mediaFieldErr ? "border-danger/50" : "border-slate-600/50"}`}
                aria-describedby={mediaFieldErr ? publishMediaFieldErrorId : undefined}
              >
                <label className="block text-small font-medium text-slate-300 mb-3">{t("community_publish_media")}</label>
                <div className="flex flex-wrap gap-2">
                  {form.previewUrls.map((url, index) => (
                    <div key={url} className={`relative rounded-[var(--radius-xl)] overflow-hidden border border-cyan-500/40 bg-slate-800 shrink-0 ${index === 0 && form.previewUrls.length > 1 ? "w-28 h-28" : "w-24 h-24"}`}>
                      <Image src={url} alt="" fill className="object-cover" sizes={index === 0 && form.previewUrls.length > 1 ? "112px" : "96px"} unoptimized={url.startsWith("blob:")} />
                      <div className="absolute inset-x-0 top-0 flex justify-between p-1 bg-black/50">
                        <form
                          className="contents"
                          onSubmit={(e: FormEvent<HTMLFormElement>) => {
                            e.preventDefault();
                            form.moveImage(index, -1);
                          }}
                        >
                          <button type="submit" disabled={index === 0} className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-[var(--radius-sm)] text-white/90 hover:bg-white/20 disabled:opacity-30 text-body-l leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/60" aria-label={t("community_prev_image")}>‹</button>
                        </form>
                        <form
                          className="contents"
                          onSubmit={(e: FormEvent<HTMLFormElement>) => {
                            e.preventDefault();
                            form.moveImage(index, 1);
                          }}
                        >
                          <button type="submit" disabled={index === form.previewUrls.length - 1} className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-[var(--radius-sm)] text-white/90 hover:bg-white/20 disabled:opacity-30 text-body-l leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/60" aria-label={t("community_next_image")}>›</button>
                        </form>
                      </div>
                      <form
                        className="contents"
                        onSubmit={(e: FormEvent<HTMLFormElement>) => {
                          e.preventDefault();
                          form.removeImage(index);
                        }}
                      >
                        <button type="submit" className="absolute top-0 right-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-bl-[var(--radius-md)] bg-danger/90 text-white text-body font-medium hover:bg-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50" aria-label={t("community_remove_photo")}>×</button>
                      </form>
                    </div>
                  ))}
                  {form.previewUrls.length < MAX_IMAGES && (
                    <>
                      <input
                        ref={form.fileInputRef}
                        type="file"
                        accept={ACCEPT_IMAGE}
                        multiple
                        className="hidden"
                        onChange={form.handleFileChange}
                        aria-label={t("community_add_photo")}
                      />
                      <form
                        className="contents"
                        onSubmit={(e: FormEvent<HTMLFormElement>) => {
                          e.preventDefault();
                          form.fileInputRef.current?.click();
                        }}
                      >
                        <button
                          type="submit"
                          className="w-24 h-24 rounded-[var(--radius-xl)] border-2 border-dashed border-slate-500/60 bg-slate-700/30 flex flex-col items-center justify-center shrink-0 cursor-pointer hover:border-cyan-400/70 hover:bg-slate-600/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 motion-sub gap-0.5"
                          aria-label={t("community_add_photo")}
                        >
                          <span className="pointer-events-none text-h3 font-light text-slate-300 leading-none" aria-hidden>
                            +
                          </span>
                          <span className="pointer-events-none text-meta text-slate-400" aria-hidden>
                            {form.previewUrls.length}/{MAX_IMAGES}
                          </span>
                        </button>
                      </form>
                    </>
                  )}
                </div>
                <p className="text-meta text-slate-400 mt-2">{photoHintText}</p>
                {mediaFieldErr ? (
                  <p id={publishMediaFieldErrorId} className="text-meta text-danger mt-2" role="alert">
                    {pf.media_urls}
                  </p>
                ) : null}
                {form.uploadError ? <p className="text-meta text-warning mt-1" role="alert">{form.uploadError}</p> : null}
              </section>
            )}

            {form.type === "text" && (
              <section className="rounded-[var(--radius-xl)] border border-fuchsia-500/25 bg-slate-800/40 px-4 py-3" aria-label={t("community_publish_text_section")}>
                <p className="text-small text-slate-300">{t("community_publish_text_hint")}</p>
              </section>
            )}

            {form.type === "video" && (
              <section
                role="group"
                aria-label={t("community_add_video")}
                className={`rounded-[var(--radius-xl)] border bg-slate-800/40 px-4 py-4 ${mediaFieldErr ? "border-danger/50" : "border-slate-600/50"}`}
                aria-describedby={mediaFieldErr ? publishMediaFieldErrorId : undefined}
              >
                <label className="block text-small font-medium text-slate-300 mb-3">{t("community_add_video")}</label>
                <div className="flex flex-wrap gap-2 items-center">
                  {form.videoPreviewUrl ? (
                    <div className="relative rounded-[var(--radius-xl)] overflow-hidden border border-cyan-500/40 bg-slate-800 w-40 h-24 shrink-0">
                      <video src={form.videoPreviewUrl} className="w-full h-full object-cover" controls muted playsInline />
                      <form
                        className="contents"
                        onSubmit={(e: FormEvent<HTMLFormElement>) => {
                          e.preventDefault();
                          form.removeVideo();
                        }}
                      >
                        <button type="submit" className="absolute top-0 right-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-bl-[var(--radius-md)] bg-danger/90 text-white text-body font-medium hover:bg-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50" aria-label={t("community_remove_video")}>×</button>
                      </form>
                    </div>
                  ) : (
                    <>
                      <input
                        ref={form.videoInputRef}
                        type="file"
                        accept={ACCEPT_VIDEO}
                        className="hidden"
                        onChange={form.handleVideoChange}
                        aria-label={t("community_add_video")}
                      />
                      <form
                        className="contents"
                        onSubmit={(e: FormEvent<HTMLFormElement>) => {
                          e.preventDefault();
                          form.videoInputRef.current?.click();
                        }}
                      >
                        <button
                          type="submit"
                          className="w-24 h-24 rounded-[var(--radius-xl)] border-2 border-dashed border-slate-500/60 bg-slate-700/30 flex flex-col items-center justify-center shrink-0 cursor-pointer hover:border-cyan-400/70 hover:bg-slate-600/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 motion-sub gap-0.5"
                          aria-label={t("community_add_video")}
                        >
                          <span className="pointer-events-none text-h3 font-light text-slate-300 leading-none" aria-hidden>
                            +
                          </span>
                          <span className="pointer-events-none text-meta text-slate-400" aria-hidden>
                            1
                          </span>
                        </button>
                      </form>
                    </>
                  )}
                </div>
                <p className="text-meta text-slate-400 mt-2">{videoHintText}</p>
                <label className="block text-small font-medium text-slate-300 mt-4 mb-1.5" htmlFor={publishVideoCoverUrlId}>
                  {t("community_publish_video_cover_optional")}
                </label>
                <input
                  id={publishVideoCoverUrlId}
                  type="url"
                  inputMode="url"
                  autoComplete="off"
                  placeholder={t("ui_placeholder_https_prefix")}
                  value={form.videoCoverUrl}
                  onChange={(e) => {
                    form.setVideoCoverUrl(e.target.value.slice(0, 2048));
                    if (publishError) onRetryPublish?.();
                  }}
                  className="w-full rounded-[var(--radius-md)] border border-slate-600/60 bg-slate-900/80 px-3 py-2.5 text-small text-slate-200 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  aria-describedby={publishVideoCoverHintId}
                />
                <p id={publishVideoCoverHintId} className="text-meta text-slate-400 mt-1.5">
                  {t("community_publish_video_cover_hint")}
                </p>
                {mediaFieldErr ? (
                  <p id={publishMediaFieldErrorId} className="text-meta text-danger mt-2" role="alert">
                    {pf.media_urls}
                  </p>
                ) : null}
                {form.uploadError ? <p className="text-meta text-warning mt-1" role="alert">{form.uploadError}</p> : null}
              </section>
            )}

            <section
              className={`rounded-[var(--radius-xl)] border bg-slate-800/40 px-4 py-4 ${bodyFieldErr ? "border-danger/45" : "border-slate-600/50"}`}
              aria-labelledby={publishContentLabelId}
            >
              <label id={publishContentLabelId} className="block text-small font-medium text-slate-300 mb-3">
                {t("community_publish_content")}
              </label>
              {bodyFieldErr ? (
                <p id={publishBodyFieldErrorId} className="text-meta text-danger/95 mb-2" role="alert">
                  {pf.body}
                </p>
              ) : null}
              <textarea
                value={form.content}
                onChange={(e) => {
                  form.setContent(e.target.value.slice(0, MAX_CHARS));
                  if (publishError) onRetryPublish?.();
                }}
                placeholder={t("community_publish_content_placeholder")}
                rows={5}
                maxLength={MAX_CHARS}
                className={
                  "w-full rounded-[var(--radius-md)] border bg-slate-900/80 px-3 py-3 text-small text-slate-200 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 resize-none min-h-[120px] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 " +
                  (bodyFieldErr
                    ? "border-danger/60 focus-visible:ring-danger/50 focus:border-danger/50"
                    : "border-slate-600/60 focus-visible:ring-cyan-400/50 focus:border-cyan-400/50")
                }
                aria-describedby={
                  [
                    showGenericPublishError && publishFormErrorId,
                    bodyFieldErr && publishBodyFieldErrorId,
                    publishCharCountId,
                    publishTopicsHintId,
                  ]
                    .filter(Boolean)
                    .join(" ") || undefined
                }
                aria-invalid={bodyFieldErr}
                aria-errormessage={
                  bodyFieldErr ? publishBodyFieldErrorId : showGenericPublishError ? publishFormErrorId : undefined
                }
              />
              <p id={publishTopicsHintId} className="mt-2 text-meta text-slate-400">
                {t("community_add_topics")}: {t("community_add_topics_placeholder")}
              </p>
              <p id={publishCharCountId} className="mt-1 text-right text-meta text-slate-400" aria-live="polite">
                <span className={form.atLimit ? "text-warning font-medium" : form.nearLimit ? "text-warning/90" : ""}>{form.charCount}/{MAX_CHARS}{t("community_char_count")}</span>
              </p>
            </section>
          </div>
        </div>

        <footer className="flex shrink-0 border-t border-slate-600/60 bg-slate-800/80 px-4 py-4 safe-area-inset-b" aria-label={t("community_publish_submit")}>
          <form
            className="w-full"
            onSubmit={(e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              if (!publishDisabled) submit();
            }}
          >
            <button
              type="submit"
              disabled={publishDisabled}
              aria-describedby={
                [
                  (!form.content.trim() || mediaMissing) && publishRequiredHintId,
                  publishError && publishFormErrorId,
                ]
                  .filter(Boolean)
                  .join(" ") || undefined
              }
              aria-busy={form.submitting ? true : undefined}
              className={`w-full rounded-[var(--radius-xl)] border-2 border-fuchsia-400/70 bg-fuchsia-500/50 py-4 min-h-[48px] text-body font-semibold text-white hover:bg-fuchsia-500/60 motion-sub disabled:opacity-50 disabled:cursor-not-allowed shadow-scifi-fuchsia-cta inline-flex items-center justify-center gap-2 ${communityPublishFabFocus}`}
            >
              {form.submitting && (
                <svg className="h-5 w-5 shrink-0 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {form.submitting ? t("community_publish_submitting") : t("community_publish_submit")}
            </button>
            <p id={publishRequiredHintId} className="mt-3 text-center text-meta text-slate-400">{t("community_publish_required_hint")}</p>
          </form>
        </footer>
      </div>
    </div>
  );
}
