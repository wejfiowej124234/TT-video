export function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

/** GET /me/following sync: on failure do not treat as "not following". */
export type FollowingListFetch = "idle" | "loading" | "ready" | "error";

export const USER_PROFILE_POSTS_VIS_TABS = [
  { key: "all" as const, labelKey: "community_me_posts_filter_all" },
  { key: "public" as const, labelKey: "community_me_posts_filter_public" },
  { key: "private" as const, labelKey: "community_me_posts_filter_private" },
  { key: "archived" as const, labelKey: "community_me_posts_filter_archived" },
] as const;
