/**
 * 社区 showcase 演示作者与用户列表（供 {@link communityShowcasePosts} / {@link communityShowcaseMessaging} 消费）。
 */
import type { CommunityPostAuthor, CommunityUserItem } from "@/lib/communityMockData";
import { AVATARS } from "@/lib/communityMockData/constants";

export function showcaseDemoAvatar(i: number): string {
  return AVATARS[i % AVATARS.length] ?? "";
}

export const SHOWCASE_WALLET_SHORT = "0xdemo…8a1f";

function traveler(id: string, nickname: string, avatarIdx: number, bio?: string): CommunityPostAuthor {
  return {
    id,
    nickname,
    avatar_url: showcaseDemoAvatar(avatarIdx),
    role: "traveler",
    bio,
    did: `did:tt:demo:${id}`,
    wallet: SHOWCASE_WALLET_SHORT,
  };
}

function guide(id: string, nickname: string, avatarIdx: number, escrow: boolean): CommunityPostAuthor {
  return {
    id,
    nickname,
    avatar_url: showcaseDemoAvatar(avatarIdx),
    role: "guide",
    isEscrowGuide: escrow,
    bio: escrow ? "平台托管认证向导 · 可接定制行程" : "本地深度向导",
    wallet: SHOWCASE_WALLET_SHORT,
  };
}

export const SHOWCASE_AUTHOR_AURORA = traveler("tt-demo-aurora", "Aurora 在路上", 0, "胶片 + 徒步，记录每一帧光。");
export const SHOWCASE_AUTHOR_KENTO = guide("tt-demo-kento", "京都向导 Kento", 1, true);
export const SHOWCASE_AUTHOR_MEI = traveler("tt-demo-mei", "Mei 食游记", 2, "街头小吃与咖啡地图。");
export const SHOWCASE_AUTHOR_LIAM = guide("tt-demo-liam", "Liam · 海岛户外", 3, false);
export const SHOWCASE_AUTHOR_YUKI = traveler("tt-demo-yuki", "Yuki 周末飞", 4, "48h 城市快闪。");

export function showcaseDemoIso(daysAgo: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 30, 0, 0);
  return d.toISOString();
}

export function showcaseUserToCommunityItem(
  a: CommunityPostAuthor,
  follow_status?: CommunityUserItem["follow_status"]
): CommunityUserItem {
  return {
    id: a.id,
    nickname: a.nickname,
    avatar_url: a.avatar_url ?? null,
    role: a.role,
    ...(a.isEscrowGuide ? { isEscrowGuide: true } : {}),
    ...(a.wallet ? { wallet: a.wallet } : {}),
    ...(follow_status ? { follow_status } : {}),
  };
}

export const SHOWCASE_FOLLOWING_USERS: CommunityUserItem[] = [
  showcaseUserToCommunityItem(SHOWCASE_AUTHOR_KENTO, "following"),
  showcaseUserToCommunityItem(SHOWCASE_AUTHOR_AURORA, "following"),
  showcaseUserToCommunityItem(SHOWCASE_AUTHOR_MEI, "following"),
];

export const SHOWCASE_FOLLOWERS_USERS: CommunityUserItem[] = [
  showcaseUserToCommunityItem(SHOWCASE_AUTHOR_LIAM, "follower"),
  showcaseUserToCommunityItem(SHOWCASE_AUTHOR_YUKI, "follower"),
  showcaseUserToCommunityItem(SHOWCASE_AUTHOR_AURORA, "follower"),
  showcaseUserToCommunityItem(SHOWCASE_AUTHOR_KENTO, "follower"),
  showcaseUserToCommunityItem(SHOWCASE_AUTHOR_MEI, "follower"),
];

export const SHOWCASE_FRIENDS_USERS: CommunityUserItem[] = [
  showcaseUserToCommunityItem(SHOWCASE_AUTHOR_AURORA, "friend"),
  showcaseUserToCommunityItem(SHOWCASE_AUTHOR_MEI, "friend"),
];
