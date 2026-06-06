"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import { TT_MARKETING_FOCUS_RING_DARK_SURFACE, TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";
import { communityMediaAbsoluteUrlForRender } from "@/lib/communityMediaClientUrl";
import { touchTargetLink44Classes} from "@/lib/travelLinkFocus";
import { marketStudioModalSectionHeadingLight } from "./marketStudioModalLayout";
import type { AcquisitionStudioDraft } from "./acquisitionCarryStudioModel";
import {
  acquisitionStudioDescClass,
  acquisitionStudioInputClass,
  acquisitionStudioLabelClass,
} from "./acquisitionCarryStudioModel";

const D = TT_MARKETING_MARKET_DARK_PATH;

type TFn = (key: string) => string;

type Props = {
  t: TFn;
  form: AcquisitionStudioDraft;
  setForm: Dispatch<SetStateAction<AcquisitionStudioDraft>>;
  coverLabelId: string;
  videoLabelId: string;
  coverInputRef: RefObject<HTMLInputElement | null>;
  videoInputRef: RefObject<HTMLInputElement | null>;
  coverTooBig: boolean;
  videoTooBig: boolean;
  onCoverPick: (file: File | null) => void;
  clearCover: () => void;
  onVideoPick: (file: File | null) => void;
  clearVideo: () => void;
};

export function AcquisitionCarryStudioFormMedia({
  t,
  form,
  setForm,
  coverLabelId,
  videoLabelId,
  coverInputRef,
  videoInputRef,
  coverTooBig,
  videoTooBig,
  onCoverPick,
  clearCover,
  onVideoPick,
  clearVideo,
}: Props) {
  const labelClass = acquisitionStudioLabelClass;
  const inputClass = acquisitionStudioInputClass;
  const descClass = acquisitionStudioDescClass;

  return (
    <section className="space-y-4" aria-labelledby="a-studio-media">
      <h3 id="a-studio-media" className={marketStudioModalSectionHeadingLight}>
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
          className={`${touchTargetLink44Classes} ${TT_MARKETING_FOCUS_RING_DARK_SURFACE} ${D.studioMediaBtn}`}
        >
          {t("market_merchantStudio_pick_cover")}
        </button>
        {coverTooBig ? (
          <p className="mt-1 text-meta text-white/95">{t("market_merchantStudio_cover_too_big")}</p>
        ) : null}
        {form.coverPreviewUrl ? (
          <div className="mt-3 space-y-2">
            <div className={D.studioMediaPreviewFrame}>
              {/* eslint-disable-next-line @next/next/no-img-element -- blob: 预览 */}
              <img
                src={communityMediaAbsoluteUrlForRender(form.coverPreviewUrl)}
                alt={t("market_merchantStudio_cover_preview_alt")}
                className="h-full w-full object-cover"
              />
            </div>
            {form.coverFileName ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-meta text-slate-400 truncate max-w-full">{form.coverFileName}</span>
                <button type="button" onClick={clearCover} className={`${touchTargetLink44Classes} text-meta ${TT_MARKETING_MARKET_DARK_PATH.studioClearLink}`}>
                  {t("market_coverClear")}
                </button>
              </div>
            ) : null}
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
          className={`${touchTargetLink44Classes} ${TT_MARKETING_FOCUS_RING_DARK_SURFACE} ${D.studioMediaBtn}`}
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
              src={communityMediaAbsoluteUrlForRender(form.videoPreviewUrl)}
              className={D.studioImageFrame}
              controls
              playsInline
              muted
            />
            <div className="flex flex-wrap items-center gap-2">
              {form.videoFileName ? (
                <span className="text-meta text-slate-400 truncate max-w-full">{form.videoFileName}</span>
              ) : null}
              <button type="button" onClick={clearVideo} className={`${touchTargetLink44Classes} text-meta ${TT_MARKETING_MARKET_DARK_PATH.studioClearLink}`}>
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
  );
}
