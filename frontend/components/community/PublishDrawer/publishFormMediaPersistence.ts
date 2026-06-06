import { uploadCommunityPostMedia } from "@/lib/apiClient/community";

async function blobUrlToDataUrl(blobUrl: string): Promise<string> {
  const r = await fetch(blobUrl);
  const blob = await r.blob();
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onloadend = () => {
      const s = fr.result;
      if (typeof s === "string") resolve(s);
      else reject(new Error("read_failed"));
    };
    fr.onerror = () => reject(new Error("read_failed"));
    fr.readAsDataURL(blob);
  });
}

/** 将 **`blob:`** 预览转为 **`POST …/upload-media`** 返回的站内 URL；已是 **`http(s):`** 或 **`/api/`** 则原样返回。 */
export async function persistCommunityMediaUrlIfBlob(url: string): Promise<string> {
  const u = url.trim();
  if (!u.startsWith("blob:")) return u;
  const dataUrl = await blobUrlToDataUrl(u);
  const up = await uploadCommunityPostMedia(dataUrl);
  if (!up || up.status !== "ok" || !up.url?.trim()) {
    const errKey = (up?.error ?? up?.message ?? "upload_failed").trim();
    if (errKey === "file_too_large" && typeof up?.max_bytes === "number" && Number.isFinite(up.max_bytes)) {
      throw new Error(`file_too_large|max_bytes=${Math.floor(up.max_bytes)}`);
    }
    if (
      errKey === "video_too_long" &&
      up &&
      typeof up.max_duration_sec === "number" &&
      Number.isFinite(up.max_duration_sec)
    ) {
      throw new Error(`video_too_long|max_duration_sec=${Math.floor(up.max_duration_sec)}`);
    }
    throw new Error(errKey || "upload_failed");
  }
  return up.url.trim();
}
