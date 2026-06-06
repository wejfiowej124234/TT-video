import type { LocaleTranslateFn } from "@/lib/i18n";
import {
  VIDEO_METADATA_TIMEOUT_MS,
  communityPostMediaMaxSizeMbLabel,
} from "./constants";

export type PublishFormVideoBlobProbeResult =
  | { ok: true; objectUrl: string }
  | { ok: false; errorMessage: string };

/**
 * 51-31-2：校验视频体积与 `<video>` 元数据时长；失败时撤销本次 `blob:` URL。
 * 与 `usePublishForm` 原 `handleVideoChange` 行为对齐（超时 / 元数据 / `onerror`）。
 */
export function probeCommunityPublishVideoBlob(
  file: File,
  maxFileBytes: number,
  maxVideoDurationSec: number,
  t: LocaleTranslateFn,
): Promise<PublishFormVideoBlobProbeResult> {
  const maxMbLabel = communityPostMediaMaxSizeMbLabel(maxFileBytes);
  if (file.size > maxFileBytes) {
    return Promise.resolve({
      ok: false,
      errorMessage: t("community_upload_error_video_size").replace("{{max}}", maxMbLabel),
    });
  }

  const url = URL.createObjectURL(file);
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    let settled = false;
    let timeoutId: number | undefined;

    const finish = (result: PublishFormVideoBlobProbeResult) => {
      if (settled) return;
      settled = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      video.onloadedmetadata = null;
      video.onerror = null;
      video.removeAttribute("src");
      resolve(result);
    };

    timeoutId = window.setTimeout(() => {
      if (settled) return;
      URL.revokeObjectURL(url);
      finish({ ok: false, errorMessage: t("community_upload_error_video_metadata") });
    }, VIDEO_METADATA_TIMEOUT_MS);

    video.onloadedmetadata = () => {
      if (settled) return;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      timeoutId = undefined;
      const dur = video.duration;
      if (!Number.isFinite(dur) || dur <= 0 || dur > maxVideoDurationSec) {
        URL.revokeObjectURL(url);
        finish({
          ok: false,
          errorMessage: t("community_upload_error_video_duration").replace(
            "{{max}}",
            String(maxVideoDurationSec),
          ),
        });
        return;
      }
      finish({ ok: true, objectUrl: url });
    };

    video.onerror = () => {
      if (settled) return;
      URL.revokeObjectURL(url);
      finish({ ok: false, errorMessage: t("community_media_load_failed") });
    };

    video.src = url;
  });
}
