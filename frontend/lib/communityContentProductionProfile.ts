/**
 * Community Content Readiness (G1) · production-ready post filter for all community surfaces.
 */

import { isLegacyDemoCommunityMediaUrl, isCommunityContentProductionProfile } from "@/lib/communityContentProfile";
import { isShowcaseAuthorId, isShowcasePostId } from "@/lib/communityShowcase";

export { isCommunityContentProductionProfile, allowCommunityShowcaseLayers } from "@/lib/communityContentProfile";
export { isLegacyDemoCommunityMediaUrl };

type PostMediaFields = {
  id: string;
  media_url?: string | null;
  media_urls?: string[] | null;
  cover_url?: string | null;
  author?: { id?: string | null } | null;
};

/** Strip layer B/C from API-mapped posts (defense in depth with governed view). */
export function filterCommunityProductionReadyPosts<T extends PostMediaFields>(posts: T[]): T[] {
  return posts.filter((p) => {
    if (isShowcasePostId(p.id)) return false;
    if (isShowcaseAuthorId(p.author?.id ?? "")) return false;
    const urls = [p.media_url, p.cover_url, ...(p.media_urls ?? [])].filter(
      (u): u is string => Boolean(u?.trim()),
    );
    if (urls.some((u) => isLegacyDemoCommunityMediaUrl(u))) return false;
    return true;
  });
}

export function communityContentReadinessViolations<T extends PostMediaFields & { content?: string }>(
  posts: T[],
): string[] {
  const out: string[] = [];
  for (const p of posts) {
    if (isShowcasePostId(p.id)) out.push(`frontend_showcase_id:${p.id}`);
    if (isShowcaseAuthorId(p.author?.id ?? "")) out.push(`frontend_showcase_author:${p.author?.id}`);
    for (const u of [p.media_url, p.cover_url, ...(p.media_urls ?? [])]) {
      if (isLegacyDemoCommunityMediaUrl(u)) out.push(`legacy_media:${u}`);
    }
  }
  return out;
}
