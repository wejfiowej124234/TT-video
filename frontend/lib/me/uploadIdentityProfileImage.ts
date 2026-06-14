import { postGuideUploadDoc } from "@/lib/apiClient";
import { compressGuideRegisterImageFile } from "@/lib/guide/compressGuideRegisterImage";
import { MAX_FILE_SIZE } from "@/app/guide/register/constants";

const ACCEPT_IMAGE = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function uploadIdentityProfileImage(file: File): Promise<string> {
  if (!ACCEPT_IMAGE.has(file.type)) {
    throw new Error("identity_profile_image_bad_type");
  }
  const compressed = await compressGuideRegisterImageFile(file, MAX_FILE_SIZE);
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onloadend = () => {
      const s = fr.result;
      if (typeof s === "string") resolve(s);
      else reject(new Error("read_failed"));
    };
    fr.onerror = () => reject(new Error("read_failed"));
    fr.readAsDataURL(compressed);
  });
  const up = await postGuideUploadDoc({ content_base64: dataUrl, filename: compressed.name });
  const url = up.url?.trim();
  if (!url) throw new Error("identity_profile_image_upload_failed");
  return url;
}
