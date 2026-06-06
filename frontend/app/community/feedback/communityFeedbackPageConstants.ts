import {
  FEEDBACK_MEDIA_ITEM_MAX_UTF8_BYTES,
  feedbackDataUrlWouldExceedItemLimit,
} from "@/lib/communityFeedbackMediaLimits";

/** 54-S19：分类选项（value 为 i18n key 后缀，展示用 `t(value)`） */
export const FEEDBACK_CATEGORIES = [
  { value: "feedback_category_attraction", labelKey: "feedback_category_attraction" },
  { value: "feedback_category_dining", labelKey: "feedback_category_dining" },
  { value: "feedback_category_product", labelKey: "feedback_category_product" },
  { value: "feedback_category_other", labelKey: "feedback_category_other" },
] as const;

export const MAX_MEDIA = 4;
export const MAX_IMAGE_SIZE = 800;

const MEDIA_ERR_FEEDBACK_ITEM_TOO_LARGE = "MEDIA_FEEDBACK_ITEM_TOO_LARGE";
const MEDIA_ERR_IMAGE_LOAD = "MEDIA_IMAGE_LOAD_FAILED";
const MEDIA_ERR_VIDEO_READ = "MEDIA_VIDEO_READ_FAILED";
const MEDIA_ERR_UNSUPPORTED_TYPE = "MEDIA_UNSUPPORTED_TYPE";

export function feedbackMediaRejectI18n(err: unknown, t: (k: string) => string): string {
  const code = err instanceof Error ? err.message : "";
  switch (code) {
    case MEDIA_ERR_FEEDBACK_ITEM_TOO_LARGE:
      return t("community_api_msg_feedback_media_too_large");
    case MEDIA_ERR_IMAGE_LOAD:
      return t("community_feedback_image_load_failed");
    case MEDIA_ERR_VIDEO_READ:
      return t("community_feedback_video_read_failed");
    case MEDIA_ERR_UNSUPPORTED_TYPE:
      return t("community_feedback_media_type_unsupported");
    default:
      return t("community_feedback_media_process_failed");
  }
}

export function fileToDataUrl(file: File, maxWidth = MAX_IMAGE_SIZE): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.type.startsWith("image/")) {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement("canvas");
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        if (w > maxWidth) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(url);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        try {
          const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.75);
          if (jpegDataUrl.length > FEEDBACK_MEDIA_ITEM_MAX_UTF8_BYTES) {
            reject(new Error(MEDIA_ERR_FEEDBACK_ITEM_TOO_LARGE));
            return;
          }
          resolve(jpegDataUrl);
        } catch {
          resolve(URL.createObjectURL(file));
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(MEDIA_ERR_IMAGE_LOAD));
      };
      img.src = url;
    } else if (file.type.startsWith("video/")) {
      const mime = file.type.length > 0 && file.type.length <= 96 ? file.type : "video/mp4";
      if (feedbackDataUrlWouldExceedItemLimit(mime, file.size)) {
        reject(new Error(MEDIA_ERR_FEEDBACK_ITEM_TOO_LARGE));
        return;
      }
      const r = new FileReader();
      r.onload = () => {
        const dataUrl = r.result as string;
        if (dataUrl.length > FEEDBACK_MEDIA_ITEM_MAX_UTF8_BYTES) {
          reject(new Error(MEDIA_ERR_FEEDBACK_ITEM_TOO_LARGE));
          return;
        }
        resolve(dataUrl);
      };
      r.onerror = () => reject(new Error(MEDIA_ERR_VIDEO_READ));
      r.readAsDataURL(file);
    } else {
      reject(new Error(MEDIA_ERR_UNSUPPORTED_TYPE));
    }
  });
}
