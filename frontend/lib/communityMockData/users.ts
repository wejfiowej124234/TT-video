/**
 * 关注/粉丝/好友 MOCK 已移除；数据来自 `/api/v1/community/me/*` 与 friends/*。
 */

import type { CommunityPostAuthor, CommunityUserItem } from "./types";

export const MOCK_FOLLOWING: CommunityUserItem[] = [];
export const MOCK_FOLLOWERS: CommunityUserItem[] = [];
export const MOCK_FRIENDS: CommunityUserItem[] = [];

export function getAuthorById(_userId: string): CommunityPostAuthor | undefined {
  return undefined;
}
