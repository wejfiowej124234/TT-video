/** F-007 · 头像上传 API 错映射为设置资料页可读文案 */
export function mapProfileAvatarUploadError(
  err: unknown,
  t: (key: string) => string,
  fallbackKey: string,
): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "object" && err !== null && "message" in err
        ? String((err as { message?: unknown }).message ?? "")
        : "";
  const lower = raw.toLowerCase();
  if (
    lower.includes("profile_avatar_use_presign") ||
    lower.includes("object_storage") ||
    lower.includes("avatar_object_storage")
  ) {
    return t("me_settings_profile_avatar_upload_presign_hint");
  }
  if (lower.includes("not implemented") || lower.includes("501") || lower.includes("allow_local_profile_avatar")) {
    return t("me_settings_profile_avatar_upload_server_disabled");
  }
  if (raw.trim()) return raw.trim();
  return t(fallbackKey);
}
