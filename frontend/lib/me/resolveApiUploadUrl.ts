import { apiUrl } from "@/lib/api";

/** 相对 `/api/v1/uploads/...` 或绝对 URL → 浏览器可加载地址 */
export function resolveApiUploadUrl(raw: string | null | undefined): string {
  const t = raw?.trim() ?? "";
  if (!t) return "";
  if (t.startsWith("http://") || t.startsWith("https://") || t.startsWith("data:")) return t;
  return apiUrl(t.startsWith("/") ? t : `/${t}`);
}
