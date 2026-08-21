import {
  postMeProfileAvatar,
  postMeProfileAvatarCommit,
  postMeProfileAvatarPresign,
} from "@/lib/apiClient";

/** Official API uses object storage: local Base64 POST returns this and FE must presign → PUT → commit. */
export function shouldFallbackToProfileAvatarPresign(err: unknown): boolean {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "object" && err !== null && "message" in err
        ? String((err as { message?: unknown }).message ?? "")
        : String(err ?? "");
  const lower = raw.toLowerCase();
  return (
    lower.includes("profile_avatar_use_presign") ||
    lower.includes("avatar_ephemeral_upload_url_forbidden") ||
    lower.includes("avatar_object_storage") ||
    lower.includes("allow_local_profile_avatar")
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onloadend = () => {
      const s = fr.result;
      if (typeof s === "string") resolve(s);
      else reject(new Error("read_failed"));
    };
    fr.onerror = () => reject(new Error("read_failed"));
    fr.readAsDataURL(file);
  });
}

/**
 * F-007 · try local `POST /me/profile-avatar`, then Official object-storage presign path.
 */
export async function uploadMeProfileAvatarFile(file: File): Promise<void> {
  const dataUrl = await fileToDataUrl(file);
  try {
    await postMeProfileAvatar({ content_base64: dataUrl });
    return;
  } catch (err) {
    if (!shouldFallbackToProfileAvatarPresign(err)) throw err;
  }
  const presign = await postMeProfileAvatarPresign({
    content_type: file.type || "image/jpeg",
    content_length: file.size,
  });
  const putHeaders: Record<string, string> = { ...(presign.headers ?? {}) };
  if (!putHeaders["Content-Type"] && !putHeaders["content-type"]) {
    putHeaders["Content-Type"] = file.type || "image/jpeg";
  }
  const putRes = await fetch(presign.upload_url, {
    method: "PUT",
    headers: putHeaders,
    body: file,
  });
  if (!putRes.ok) {
    throw new Error(`profile_avatar_object_put_failed_${putRes.status}`);
  }
  await postMeProfileAvatarCommit({ avatar_url: presign.avatar_url });
}
