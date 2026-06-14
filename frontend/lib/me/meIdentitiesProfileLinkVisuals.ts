import type { MeIdentitiesProfileLinkId } from "@/lib/me/meIdentitiesProfileLinksModel";
import { resolveApiUploadUrl } from "@/lib/me/resolveApiUploadUrl";

/** ① Hub「身份资料」左侧缩略图 · 无上传时的 L5 分轨占位（与 settings 预览同源图床） */
export const ME_IDENTITIES_PROFILE_LINK_FALLBACK_IMAGES: Readonly<
  Record<MeIdentitiesProfileLinkId, string>
> = {
  acquisition:
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=480&h=640&q=80",
  guide: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=480&h=640&q=80",
  merchant:
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=480&h=640&q=80",
  steward:
    "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=480&h=640&q=80",
};

export function meIdentitiesProfileLinkFallbackImage(id: MeIdentitiesProfileLinkId): string {
  return ME_IDENTITIES_PROFILE_LINK_FALLBACK_IMAGES[id];
}

export function resolveMeIdentitiesProfileLinkThumb(
  id: MeIdentitiesProfileLinkId,
  rawUrl: string | null | undefined,
): string {
  const resolved = resolveApiUploadUrl(rawUrl);
  return resolved || meIdentitiesProfileLinkFallbackImage(id);
}
