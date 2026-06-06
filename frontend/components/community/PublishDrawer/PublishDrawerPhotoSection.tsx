"use client";

import Image from "next/image";
import { MAX_IMAGES, ACCEPT_IMAGE } from "./constants";
import type { PublishDrawerFormModel } from "./usePublishForm";
import type { LocaleTranslateFn } from "@/lib/i18n";
import { TT_COMMUNITY_DRAWER_L5 } from "@/lib/marketingUi";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaNextImageUnoptimized,
} from "@/lib/communityMediaClientUrl";

export type PublishDrawerPhotoSectionProps = {
  t: LocaleTranslateFn;
  form: Pick<
    PublishDrawerFormModel,
    | "previewUrls"
    | "moveImage"
    | "removeImage"
    | "fileInputRef"
    | "handleFileChange"
    | "uploadError"
  >;
  photoPickInputId: string;
  publishMediaFieldErrorId: string;
  mediaFieldErr: boolean;
  mediaUrlsMessage?: string;
  photoHintText: string;
  /** 美食/旅行帖图片可选 */
  optionalMedia?: boolean;
};

export function PublishDrawerPhotoSection({
  t,
  form,
  photoPickInputId,
  publishMediaFieldErrorId,
  mediaFieldErr,
  mediaUrlsMessage,
  photoHintText,
  optionalMedia = false,
}: PublishDrawerPhotoSectionProps) {
  return (
    <section
      role="group"
      aria-label={t("community_add_photo")}
      className={`${TT_COMMUNITY_DRAWER_L5.publishFieldSection} ${mediaFieldErr ? "border-danger/50" : TT_COMMUNITY_DRAWER_L5.publishFieldBorderOk}`}
      aria-describedby={mediaFieldErr ? publishMediaFieldErrorId : undefined}
    >
      <label className="block text-small font-medium text-slate-300 mb-3">
        {optionalMedia ? t("community_publish_media_optional") : t("community_publish_media")}
      </label>
      <div className="flex flex-wrap gap-2">
        {form.previewUrls.map((url, index) => {
          const resolvedPhoto = communityMediaAbsoluteUrlForRender(url);
          return (
            <div
              key={url}
              className={`relative rounded-[var(--radius-xl)] overflow-hidden border border-ref-sun/30 bg-ink-800 shrink-0 ${index === 0 && form.previewUrls.length > 1 ? "w-28 h-28" : "w-24 h-24"}`}
            >
              <Image
                src={resolvedPhoto}
                alt={t("community_publish_photo_preview_alt").replace(/\{\{n\}\}/g, String(index + 1))}
                fill
                className="object-cover"
                sizes={index === 0 && form.previewUrls.length > 1 ? "112px" : "96px"}
                unoptimized={communityMediaNextImageUnoptimized(resolvedPhoto)}
              />
              <div className="absolute inset-x-0 top-0 flex justify-between p-1 bg-black/50">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => form.moveImage(index, -1)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-[var(--radius-sm)] text-white/90 hover:bg-white/20 disabled:opacity-30 text-body-l leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/60"
                  aria-label={t("community_prev_image")}
                  title={index === 0 ? t("community_publish_reorder_no_prev") : undefined}
                >
                  ‹
                </button>
                <button
                  type="button"
                  disabled={index === form.previewUrls.length - 1}
                  onClick={() => form.moveImage(index, 1)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-[var(--radius-sm)] text-white/90 hover:bg-white/20 disabled:opacity-30 text-body-l leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/60"
                  aria-label={t("community_next_image")}
                  title={index === form.previewUrls.length - 1 ? t("community_publish_reorder_no_next") : undefined}
                >
                  ›
                </button>
              </div>
              <button
                type="button"
                onClick={() => form.removeImage(index)}
                className="absolute top-0 right-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-bl-[var(--radius-md)] bg-danger/90 text-white text-body font-medium hover:bg-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                aria-label={t("community_remove_photo")}
              >
                ×
              </button>
            </div>
          );
        })}
        {form.previewUrls.length < MAX_IMAGES && (
          <>
            <input
              ref={form.fileInputRef}
              id={photoPickInputId}
              type="file"
              accept={ACCEPT_IMAGE}
              multiple
              className="sr-only"
              onChange={form.handleFileChange}
              aria-label={t("community_add_photo")}
            />
            <label
              htmlFor={photoPickInputId}
              className={`w-24 h-24 rounded-[var(--radius-xl)] flex flex-col items-center justify-center shrink-0 cursor-pointer ${TT_COMMUNITY_DRAWER_L5.publishDashedTile}`}
            >
              <span className="pointer-events-none text-h3 font-light text-slate-300 leading-none" aria-hidden>
                +
              </span>
              <span className="pointer-events-none text-meta text-slate-400" aria-hidden>
                {form.previewUrls.length}/{MAX_IMAGES}
              </span>
            </label>
          </>
        )}
      </div>
      <p className="text-small text-slate-200/90 mt-2 leading-relaxed" role="note">
        {photoHintText}
      </p>
      {mediaFieldErr ? (
        <p id={publishMediaFieldErrorId} className="text-meta text-danger mt-2" role="alert">
          {mediaUrlsMessage}
        </p>
      ) : null}
      {form.uploadError ? (
        <p className="text-meta text-warning mt-1" role="alert">
          {form.uploadError}
        </p>
      ) : null}
    </section>
  );
}
