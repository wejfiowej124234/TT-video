import type { Locale } from "@/lib/i18n";
import type { CommunityPost } from "@/lib/communityMockData";
import { formatCommunityDate } from "@/lib/communityFormatters";
import {
  communityFeedDistanceLabel,
  communityFeedMasonryLocationParts,
} from "@/components/community/communityFeedLocationDistance";

export function formatCommunityPostRelativeTime(
  createdAt: string,
  locale: Locale,
  t: (key: string, vars?: Record<string, string>) => string,
): string {
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Math.max(0, Date.now() - d.getTime());
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return t("community_post_time_just_now");
  if (mins < 60) return t("community_post_time_minutes", { n: String(mins) });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t("community_post_time_hours", { n: String(hours) });
  const days = Math.floor(hours / 24);
  if (days < 7) return t("community_post_time_days", { n: String(days) });
  return formatCommunityDate(createdAt, locale);
}

export function formatPostDetailLocationLine(
  post: CommunityPost,
  t: (key: string) => string,
): string | null {
  if (post.distanceM != null && post.distanceM >= 0) {
    const km = (post.distanceM / 1000).toFixed(1);
    const dist = communityFeedDistanceLabel(t, km);
    const venue = post.venueName?.trim();
    if (venue) return `${venue} · ${dist}`;
    return dist;
  }
  const parts = communityFeedMasonryLocationParts({
    id: post.id,
    destination: post.destination,
    tags: post.tags,
    type: post.type,
    t,
  });
  if (!parts) return post.venueName?.trim() || null;
  return `${parts.name} · ${communityFeedDistanceLabel(t, parts.distanceKm)}`;
}
