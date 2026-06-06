import type { CommunityPostUserVisibility } from "@/lib/communityMockData";

export type CommunityMePostsVisFilterKey = "all" | CommunityPostUserVisibility;

export const COMMUNITY_ME_POSTS_VIS_TABS: { key: CommunityMePostsVisFilterKey; labelKey: string }[] = [
  { key: "all", labelKey: "community_me_posts_filter_all" },
  { key: "public", labelKey: "community_me_posts_filter_public" },
  { key: "private", labelKey: "community_me_posts_filter_private" },
  { key: "archived", labelKey: "community_me_posts_filter_archived" },
];

const VIS_FILTER_KEYS = new Set<string>(COMMUNITY_ME_POSTS_VIS_TABS.map((t) => t.key));

/** 解析 `?vis=`（独立页书签 · 非法值回 `all`） */
export function parseCommunityMePostsVisQuery(raw: string | null | undefined): CommunityMePostsVisFilterKey {
  const v = (raw ?? "").trim().toLowerCase();
  if (VIS_FILTER_KEYS.has(v)) return v as CommunityMePostsVisFilterKey;
  return "all";
}

export function communityMePostsVisFilterLabelKey(key: CommunityMePostsVisFilterKey): string {
  return COMMUNITY_ME_POSTS_VIS_TABS.find((t) => t.key === key)?.labelKey ?? "community_me_posts_filter_all";
}
