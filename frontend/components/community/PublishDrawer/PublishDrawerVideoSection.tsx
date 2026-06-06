"use client";

import Image from "next/image";
import { ACCEPT_IMAGE, ACCEPT_VIDEO } from "./constants";
import type { PublishDrawerFormModel } from "./usePublishForm";
import type { LocaleTranslateFn } from "@/lib/i18n";
import { TT_COMMUNITY_DRAWER_L5 } from "@/lib/marketingUi";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaNextImageUnoptimized,
} from "@/lib/communityMediaClientUrl";

export type PublishDrawerVideoSectionProps = {
  t: LocaleTranslateFn;
  form: Pick<
    PublishDrawerFormModel,
    | "videoPreviewUrl"
    | "videoInputRef"
    | "handleVideoChange"
    | "removeVideo"
    | "videoCoverUrl"
    | "coverInputRef"
    | "handleCoverChange"
    | "removeCover"
    | "uploadError"
    | "submitting"
    | "videoUploadProgress"
    | "videoUploadHint"
    | "retryVideoUpload"
  >;
  videoPickInputId: string;
  videoCoverPickInputId: string;
  publishMediaFieldErrorId: string;
  publishVideoCoverHintId: string;
  publishVideoCoverFieldErrorId: string;
  mediaFieldErr: boolean;
  coverFieldErr: boolean;
  mediaUrlsMessage?: string;
  coverUrlMessage?: string;
  videoHintText: string;
  /** capability 未就绪或拉取失败时禁止选视频文件，避免先选大文件再 503 */
  videoPickDisabled?: boolean;
  publishError?: boolean;
  onRetryPublish?: () => void;
};

export function PublishDrawerVideoSection({
  t,
  form,
  videoPickInputId,
  videoCoverPickInputId,
  publishMediaFieldErrorId,
  publishVideoCoverHintId,
  publishVideoCoverFieldErrorId,
  mediaFieldErr,
  coverFieldErr,
  mediaUrlsMessage,
  coverUrlMessage,
  videoHintText,
  videoPickDisabled = false,
  publishError,
  onRetryPublish,
}: PublishDrawerVideoSectionProps) {
  const coverPreview = form.videoCoverUrl.trim();
  const resolvedCover = coverPreview ? communityMediaAbsoluteUrlForRender(coverPreview) : "";

  return (
    <section
      role="group"
      aria-label={t("community_add_video")}
      className={`${TT_COMMUNITY_DRAWER_L5.publishFieldSection} ${mediaFieldErr || coverFieldErr ? "border-danger/50" : TT_COMMUNITY_DRAWER_L5.publishFieldBorderOk}`}
      aria-describedby={
        [mediaFieldErr && publishMediaFieldErrorId, coverFieldErr && publishVideoCoverFieldErrorId]
          .filter(Boolean)
          .join(" ") || undefined
      }
    >
      <label className="block text-small font-medium text-slate-300 mb-3">{t("community_add_video")}</label>
      <div className="flex flex-wrap gap-2 items-center">
        {form.videoPreviewUrl ? (
          <div className="relative rounded-[var(--radius-xl)] overflow-hidden border border-ref-sun/30 bg-ink-800 w-40 h-24 shrink-0">
            <video
              src={communityMediaAbsoluteUrlForRender(form.videoPreviewUrl)}
              className="w-full h-full object-cover"
              controls
              muted
              playsInline
            />
            <button
              type="button"
              onClick={() => form.removeVideo()}
              className="absolute top-0 right-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-bl-[var(--radius-md)] bg-danger/90 text-white text-body font-medium hover:bg-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              aria-label={t("community_remove_video")}
            >
              ×
            </button>
          </div>
        ) : (
          <>
            <input
              ref={form.videoInputRef}
              id={videoPickInputId}
              type="file"
              accept={ACCEPT_VIDEO}
              disabled={videoPickDisabled}
              className="sr-only"
              onChange={form.handleVideoChange}
              aria-label={t("community_add_video")}
            />
            <label
              htmlFor={videoPickInputId}
              className={`w-24 h-24 rounded-[var(--radius-xl)] flex flex-col items-center justify-center shrink-0 ${TT_COMMUNITY_DRAWER_L5.publishDashedTile} ${
                videoPickDisabled
                  ? "cursor-not-allowed opacity-50 pointer-events-none"
                  : "cursor-pointer hover:border-ref-sun/50 hover:bg-ink-600/40"
              }`}
            >
              <span className="pointer-events-none text-h3 font-light text-slate-300 leading-none" aria-hidden>
                +
              </span>
              <span className="pointer-events-none text-meta text-slate-400" aria-hidden>
                1
              </span>
            </label>
          </>
        )}
      </div>
      <p className="text-small text-slate-200/90 mt-2 leading-relaxed" role="note">
        {videoHintText}
      </p>
      <p className="block text-small font-medium text-slate-300 mt-4 mb-1.5">{t("community_publish_video_cover_optional")}</p>
      <div className="flex flex-wrap gap-2 items-start">
        {coverPreview ? (
          <div className="relative rounded-[var(--radius-xl)] overflow-hidden border border-ref-sun/30 bg-ink-800 w-24 h-24 shrink-0">
            <Image
              src={resolvedCover}
              alt={t("community_publish_video_cover_preview_alt")}
              fill
              className="object-cover"
              sizes="96px"
              unoptimized={communityMediaNextImageUnoptimized(resolvedCover)}
            />
            <button
              type="button"
              onClick={() => {
                form.removeCover();
                if (publishError) onRetryPublish?.();
              }}
              className="absolute top-0 right-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-bl-[var(--radius-md)] bg-danger/90 text-white text-body font-medium hover:bg-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              aria-label={t("community_publish_video_cover_remove")}
            >
              ×
            </button>
          </div>
        ) : null}
        <input
          ref={form.coverInputRef}
          id={videoCoverPickInputId}
          type="file"
          accept={ACCEPT_IMAGE}
          className="sr-only"
          onChange={form.handleCoverChange}
          aria-label={t("community_publish_video_cover_pick")}
          aria-describedby={publishVideoCoverHintId}
          disabled={form.submitting}
        />
        <label
          htmlFor={videoCoverPickInputId}
          className={`min-h-[44px] inline-flex items-center justify-center rounded-[var(--radius-md)] border px-4 py-2.5 text-small font-semibold motion-sub focus-within:outline-none focus-within:ring-2 focus-within:ring-ref-sun focus-within:ring-offset-2 focus-within:ring-offset-ink-950 ${
            form.submitting
              ? "cursor-not-allowed opacity-50 border-ref-sun/14 text-slate-400"
              : "cursor-pointer border-ref-sun/45 bg-ink-800/90 text-ref-sun hover:bg-ref-sun/12 hover:border-ref-sun/55 hover:text-[#ffe9a8]"
          }`}
        >
          {coverPreview ? t("community_publish_video_cover_replace") : t("community_publish_video_cover_pick")}
        </label>
      </div>
      <p id={publishVideoCoverHintId} className="text-small text-slate-300 mt-1.5 leading-relaxed">
        {t("community_publish_video_cover_hint")}
      </p>
      {coverFieldErr ? (
        <p id={publishVideoCoverFieldErrorId} className="text-meta text-danger mt-2" role="alert">
          {coverUrlMessage}
        </p>
      ) : null}
      {mediaFieldErr ? (
        <p id={publishMediaFieldErrorId} className="text-meta text-danger mt-2" role="alert">
          {mediaUrlsMessage}
        </p>
      ) : null}
      {form.uploadError ? (
        <div className="mt-2 space-y-2">
          <p className="text-meta text-warning" role="alert">
            {form.uploadError}
          </p>
          {!form.submitting && form.videoPreviewUrl ? (
            <button
              type="button"
              onClick={() => form.retryVideoUpload()}
              className="rounded-[var(--radius-md)] border border-warning/50 bg-warning/10 px-3 py-2 text-meta font-medium text-warning/95 hover:bg-warning/20 motion-sub min-h-[44px]"
            >
              {t("community_video_upload_retry")}
            </button>
          ) : null}
        </div>
      ) : null}
      {form.submitting && form.videoUploadProgress && form.videoUploadHint ? (
        <div className="mt-3" aria-live="polite">
          <div
            className="h-2 rounded bg-ink-700/80 overflow-hidden"
            role="progressbar"
            aria-valuenow={form.videoUploadProgress.pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-ref-sun/85 transition-[width] duration-200 ease-out"
              style={{ width: `${form.videoUploadProgress.pct}%` }}
            />
          </div>
          <p className="text-meta text-slate-400 mt-1.5">{form.videoUploadHint}</p>
        </div>
      ) : null}
    </section>
  );
}
