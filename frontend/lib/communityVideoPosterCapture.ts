/**
 * 从本地 **`blob:`** 视频截取一帧为 JPEG，经 **`POST …/community/posts/upload-media`**
 * 落盘为 **`cover_url`** 可用的站内 URL（与 04 §三、`routes/community/media_upload` 白名单一致）。
 */
import { uploadCommunityPostMedia } from "@/lib/apiClient/community";

function decodedBytesFromDataUrl(dataUrl: string): number {
  const i = dataUrl.indexOf(",");
  if (i < 0) return Number.POSITIVE_INFINITY;
  const b64 = dataUrl.slice(i + 1).replace(/\s/g, "");
  return Math.floor((b64.length * 3) / 4);
}

function waitSeeked(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = window.setTimeout(() => {
      video.removeEventListener("seeked", onOk);
      video.removeEventListener("error", onErr);
      reject(new Error("seek_timeout"));
    }, 12_000);
    const onOk = () => {
      window.clearTimeout(t);
      video.removeEventListener("seeked", onOk);
      video.removeEventListener("error", onErr);
      resolve();
    };
    const onErr = () => {
      window.clearTimeout(t);
      video.removeEventListener("seeked", onOk);
      video.removeEventListener("error", onErr);
      reject(new Error("video_error"));
    };
    video.addEventListener("seeked", onOk, { once: true });
    video.addEventListener("error", onErr, { once: true });
  });
}

function drawScaledFrame(
  video: HTMLVideoElement,
  maxEdge: number,
  quality: number
): string | null {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!Number.isFinite(vw) || !Number.isFinite(vh) || vw < 2 || vh < 2) return null;
  const scale = Math.min(1, maxEdge / Math.max(vw, vh));
  const cw = Math.max(2, Math.round(vw * scale));
  const ch = Math.max(2, Math.round(vh * scale));
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, cw, ch);
  try {
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return null;
  }
}

/**
 * 截取当前帧并上传；失败返回 **`null`**（不抛错，调用方继续无封面发帖）。
 *
 * @param maxDecodedBytes 与 **`TRAVELTRUST_COMMUNITY_POST_MEDIA_MAX_DECODED_BYTES`** / 前端 env 同源钳位
 */
export async function uploadPosterJpegFromVideoBlobUrl(
  blobUrl: string,
  maxDecodedBytes: number
): Promise<string | null> {
  if (!blobUrl.startsWith("blob:")) return null;
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";

  await new Promise<void>((resolve, reject) => {
    const to = window.setTimeout(() => {
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("error", onMetaErr);
      reject(new Error("metadata_timeout"));
    }, 12_000);
    const onMeta = () => {
      window.clearTimeout(to);
      video.removeEventListener("error", onMetaErr);
      resolve();
    };
    const onMetaErr = () => {
      window.clearTimeout(to);
      video.removeEventListener("loadedmetadata", onMeta);
      reject(new Error("metadata_error"));
    };
    video.addEventListener("loadedmetadata", onMeta, { once: true });
    video.addEventListener("error", onMetaErr, { once: true });
    video.src = blobUrl;
  });

  const dur = video.duration;
  const t =
    Number.isFinite(dur) && dur > 0
      ? Math.min(Math.max(dur * 0.02, 0.04), Math.min(0.25, dur * 0.5))
      : 0.04;
  video.currentTime = t;
  await waitSeeked(video);

  const maxEdges = [720, 560, 420, 320] as const;
  const qualities = [0.82, 0.72, 0.6, 0.5, 0.42, 0.34] as const;

  for (const edge of maxEdges) {
    for (const q of qualities) {
      const dataUrl = drawScaledFrame(video, edge, q);
      if (!dataUrl) continue;
      if (decodedBytesFromDataUrl(dataUrl) > maxDecodedBytes * 0.98) continue;
      const up = await uploadCommunityPostMedia(dataUrl);
      if (up?.status === "ok" && up.url?.trim()) return up.url.trim();
      return null;
    }
  }
  return null;
}
