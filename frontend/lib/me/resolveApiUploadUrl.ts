import { communityMediaAbsoluteUrlForRender } from "@/lib/communityMediaClientUrl";

/** 相对 `/api/v1/uploads/...` 或绝对 URL → 浏览器可加载地址（含 OCS legacy→Tigris remap）。 */
export function resolveApiUploadUrl(raw: string | null | undefined): string {
  return communityMediaAbsoluteUrlForRender(raw);
}
