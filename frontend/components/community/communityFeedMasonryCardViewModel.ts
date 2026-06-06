import type { CommunityPost } from "@/lib/communityMockData";
import { DESTINATION_LABEL_KEYS } from "@/components/community/communityFeedConstants";
import { communityFeedMasonryDisplayTitle } from "@/components/community/communityFeedDisplayText";
import {
  communityFeedDistanceLabel,
  communityFeedMasonryLocationParts,
  communityFeedStableDistanceKm,
} from "@/components/community/communityFeedLocationDistance";
import { communityFeedMasonryMediaAspectClass } from "@/components/community/communityFeedMasonryAspect";
import {
  communityPostGridThumbRaw,
  resolveCommunityPostPlayableVideoUrl,
} from "@/components/community/communityFeedMappersRoleAndMedia";
import { communityFeedCommerceListingHref } from "@/components/community/communityFeedCommerceHref";

export type CommunityFeedMasonryLocationViewModel = {
  name: string;
  distanceLabel: string;
  /** ① 无 GPS/POI 真源时为 true */
  distanceIsPlaceholder: boolean;
};

export type CommunityFeedMasonryCardViewModel = {
  postId: string;
  displayTitle: string;
  location: CommunityFeedMasonryLocationViewModel | null;
  mediaAspectClass: string;
  isVideoPost: boolean;
  isTextOnly: boolean;
  isSponsored: boolean;
  thumbSrc: string;
  videoSrc: string;
  posterSrc: string | undefined;
  authorNickname: string;
  likeCountBase: number;
  commerceListingHref: string | undefined;
};

function resolveDestinationLabel(
  post: Pick<CommunityPost, "destination">,
  t: (key: string) => string,
): string | null {
  const dest = post.destination?.trim();
  if (!dest) return null;
  const key = DESTINATION_LABEL_KEYS[dest];
  return key ? t(key) : dest;
}

function resolveLocationName(
  post: CommunityPost,
  destLabel: string | null,
  t: (key: string) => string,
): string | null {
  const venue = post.venueName?.trim();
  if (venue) return venue;

  return communityFeedMasonryLocationParts({
    id: post.id,
    destination: post.destination,
    tags: post.tags,
    destinationLabel: destLabel,
    type: post.type,
    t,
  })?.name ?? null;
}

function resolveDistanceLabel(
  post: CommunityPost,
  locationName: string | null,
  t: (key: string) => string,
): { distanceLabel: string; distanceIsPlaceholder: boolean } {
  if (post.distanceM != null && Number.isFinite(post.distanceM)) {
    const km = (post.distanceM / 1000).toFixed(1);
    return { distanceLabel: communityFeedDistanceLabel(t, km), distanceIsPlaceholder: false };
  }
  const km = communityFeedStableDistanceKm(`${post.id}:${locationName ?? post.id}`);
  return { distanceLabel: communityFeedDistanceLabel(t, km), distanceIsPlaceholder: true };
}

function resolveIsSponsored(post: CommunityPost): boolean {
  if (post.isSponsored === true) return true;
  if (post.commerceShowcaseKind === "sponsored") return true;
  return (post.tags ?? []).some((tag) => /^#?ad$/i.test(tag.trim()));
}

/** Domain 帖 → 瀑布卡展示 VM（L5 唯一入口） */
export function communityFeedMasonryCardViewModel(
  post: CommunityPost,
  t: (key: string) => string,
): CommunityFeedMasonryCardViewModel {
  const dash = t("ui_em_dash");
  const isVideoPost = post.is_video === true || post.type === "video";
  const videoUrlRaw = isVideoPost ? resolveCommunityPostPlayableVideoUrl(post) : undefined;
  const videoSrc = videoUrlRaw ?? "";
  const thumbRaw = communityPostGridThumbRaw(post);
  const thumbSrc = thumbRaw ?? "";
  const isTextOnly = post.type === "text" && !thumbSrc && !videoSrc;

  const destLabel = resolveDestinationLabel(post, t);
  const locationName = resolveLocationName(post, destLabel, t);
  const distance = resolveDistanceLabel(post, locationName, t);

  const location: CommunityFeedMasonryLocationViewModel | null = locationName
    ? {
        name: locationName,
        distanceLabel: distance.distanceLabel,
        distanceIsPlaceholder: distance.distanceIsPlaceholder,
      }
    : null;

  return {
    postId: post.id,
    displayTitle: communityFeedMasonryDisplayTitle(
      {
        title: post.title,
        content: post.content,
        type: post.type,
        destination: post.destination,
        venueName: post.venueName,
        authorNickname: post.author?.nickname,
        tags: post.tags,
      },
      t,
    ),
    location,
    mediaAspectClass: communityFeedMasonryMediaAspectClass(post),
    isVideoPost,
    isTextOnly,
    isSponsored: resolveIsSponsored(post),
    thumbSrc,
    videoSrc,
    posterSrc: thumbSrc || undefined,
    authorNickname: post.author?.nickname ?? dash,
    likeCountBase: post.likes,
    commerceListingHref: communityFeedCommerceListingHref(post),
  };
}
