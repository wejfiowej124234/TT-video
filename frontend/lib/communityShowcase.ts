/**
 * TT 社区功能演示数据：当 Feed/会话/关系链 API 返回空列表时注入（见 shouldUseCommunityShowcaseOnEmpty）。
 * 生产构建默认关闭；开发环境默认开启，可用 NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE=0 关闭或 =1 强制开启。
 */

import type { CommunityPost, CommunityPostAuthor, CommunityUserItem } from "@/lib/communityMockData";
import { allowCommunityShowcaseLayers, isCommunityContentProductionProfile } from "@/lib/communityContentProfile";
import { AVATARS, FOOD_IMAGES_POOL, TRAVEL_IMAGES_POOL, pick } from "@/lib/communityMockData/constants";
import type { CommunityDmMessageRow } from "@/lib/apiClient/community";

/** ① 本地 demo · 可直连 MP4（剔除 GCS 等不稳定源） */
const VIDEO_SAMPLES = [
  "https://www.w3schools.com/html/mov_bbb.mp4",
  "https://download.samplelib.com/mp4/sample-5s.mp4",
  "https://download.samplelib.com/mp4/sample-10s.mp4",
  "https://filesamples.com/samples/video/mp4/sample_640x360.mp4",
] as const;

/** 关注流演示：这些作者的帖子会出现在「关注」Tab */
export const SHOWCASE_FOLLOW_AUTHOR_IDS: readonly string[] = [
  "tt-demo-kento",
  "tt-demo-aurora",
  "tt-demo-mei",
];

function communityShowcaseExplicitlyOff(): boolean {
  const v = (process.env.NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE ?? "").trim().toLowerCase();
  return v === "0" || v === "false" || v === "off";
}

export function shouldUseCommunityShowcaseOnEmpty(): boolean {
  if (typeof process === "undefined") return false;
  if (!allowCommunityShowcaseLayers()) return false;
  if (communityShowcaseExplicitlyOff()) return false;
  if (process.env.NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE === "1") return true;
  return process.env.NODE_ENV === "development";
}

/** 关系链空态（friends / messages）演示数据：与 Feed `onEmpty` 同门闸（dev 默认开、`=0` 关、`=1` 强制开）。 */
export function shouldUseCommunityShowcaseForRelationalUi(): boolean {
  return shouldUseCommunityShowcaseOnEmpty();
}

export function isShowcaseConversationId(conversationId: string): boolean {
  return conversationId.startsWith("tt-showcase-conv-");
}

/** ① 本地 Feed 注入帖（`COMMUNITY_SHOWCASE_POSTS`）；写接口会返回 `invalid_post`。 */
export function isShowcasePostId(postId: string): boolean {
  return postId.startsWith("tt-showcase-post-");
}

/** ① 演示作者（`tt-demo-*`）；关注写接口在空库/本地演示下不可用。 */
export function isShowcaseAuthorId(authorId: string): boolean {
  return authorId.startsWith("tt-demo-");
}

function sa(i: number): string {
  return AVATARS[i % AVATARS.length] ?? "";
}

const wShort = "0xdemo…8a1f";

function traveler(id: string, nickname: string, avatarIdx: number, bio?: string): CommunityPostAuthor {
  return {
    id,
    nickname,
    avatar_url: sa(avatarIdx),
    role: "traveler",
    bio,
    did: `did:tt:demo:${id}`,
    wallet: wShort,
  };
}

function guide(id: string, nickname: string, avatarIdx: number, escrow: boolean): CommunityPostAuthor {
  return {
    id,
    nickname,
    avatar_url: sa(avatarIdx),
    role: "guide",
    isEscrowGuide: escrow,
    bio: escrow ? "平台托管认证向导 · 可接定制行程" : "本地深度向导",
    wallet: wShort,
  };
}

const AURORA = traveler("tt-demo-aurora", "Aurora 在路上", 0, "胶片 + 徒步，记录每一帧光。");
const KENTO = guide("tt-demo-kento", "京都向导 Kento", 1, true);
const MEI = traveler("tt-demo-mei", "Mei 食游记", 2, "街头小吃与咖啡地图。");
const LIAM = guide("tt-demo-liam", "Liam · 海岛户外", 3, false);
const YUKI = traveler("tt-demo-yuki", "Yuki 周末飞", 4, "48h 城市快闪。");

const iso = (daysAgo: number, hour = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 30, 0, 0);
  return d.toISOString();
};

function makeShowcasePost(
  p: Omit<CommunityPost, "likes" | "comments" | "collects"> & Partial<Pick<CommunityPost, "likes" | "comments" | "collects">>
): CommunityPost {
  return {
    likes: 42,
    comments: 6,
    collects: 11,
    ...p,
  };
}

/** 推荐/发现/空库 Feed 注入的全量帖子（含多图、视频、美食、纯文） */
export const COMMUNITY_SHOWCASE_POSTS: CommunityPost[] = [
  makeShowcasePost({
    id: "tt-showcase-post-001",
    type: "travel",
    content:
      "清晨的祇园石板路几乎没人，八坂塔方向顺光。三条路线里最喜欢「东山散步道」，记得穿软底鞋。#摄影 #京都",
    media_url: pick(TRAVEL_IMAGES_POOL, 2),
    media_urls: [pick(TRAVEL_IMAGES_POOL, 2), pick(TRAVEL_IMAGES_POOL, 5), pick(TRAVEL_IMAGES_POOL, 7)],
    destination: "京都",
    tags: ["#摄影", "#京都", "#旅行"],
    author: AURORA,
    created_at: iso(1, 8),
    likedByMe: false,
    collectedByMe: false,
    authorFollowedByMe: true,
    likes: 128,
    comments: 14,
    collects: 36,
  }),
  makeShowcasePost({
    id: "tt-showcase-post-002",
    type: "video",
    content:
      "30 秒带你看清水寺晨雾与仁王门开门的节奏。下一支想拍「伏见稻荷」夜灯，有想看的机位留言。#攻略 #视频",
    media_url: VIDEO_SAMPLES[0],
    cover_url: pick(TRAVEL_IMAGES_POOL, 3),
    is_video: true,
    destination: "京都",
    tags: ["#攻略", "#视频", "#旅行"],
    author: KENTO,
    created_at: iso(0, 19),
    evidenceAnchored: true,
    likes: 256,
    comments: 32,
    collects: 58,
    authorFollowedByMe: true,
  }),
  makeShowcasePost({
    id: "tt-showcase-post-003",
    type: "food",
    content: "筑地场外市场这碗海鲜下，醋饭温度刚好，海胆甜而不腥。排队约 25 分钟，建议 9 点前到。#美食 #东京",
    media_url: pick(FOOD_IMAGES_POOL, 1),
    destination: "东京",
    tags: ["#美食", "#东京"],
    author: MEI,
    created_at: iso(2, 11),
    likes: 89,
    comments: 9,
    collects: 21,
    authorFollowedByMe: true,
  }),
  makeShowcasePost({
    id: "tt-showcase-post-004",
    type: "video",
    content: "佩尼达岛精灵坠崖，风浪大但值得。无人机片段已调色，观看请开声音。#海岛 #巴厘岛",
    media_url: VIDEO_SAMPLES[1],
    cover_url: pick(TRAVEL_IMAGES_POOL, 8),
    is_video: true,
    destination: "巴厘岛",
    tags: ["#海岛", "#旅行"],
    author: LIAM,
    created_at: iso(3, 16),
    likes: 512,
    comments: 48,
    collects: 102,
  }),
  makeShowcasePost({
    id: "tt-showcase-post-005",
    type: "text",
    content:
      "本周快闪：周五晚飞大阪，周日回。只带 20L 背包，行程要点见正文（演示文案）。#周末游",
    media_url: pick(TRAVEL_IMAGES_POOL, 4),
    destination: "大阪",
    tags: ["#周末游", "#旅行"],
    author: YUKI,
    created_at: iso(0, 12),
    likes: 34,
    comments: 5,
    collects: 8,
  }),
  makeShowcasePost({
    id: "tt-showcase-post-006",
    type: "video",
    content: "塞纳河游船黄昏一镜到底，无滤镜。巴黎秋天真的短，抓紧拍。#摄影 #巴黎",
    media_url: VIDEO_SAMPLES[2],
    cover_url: pick(TRAVEL_IMAGES_POOL, 6),
    is_video: true,
    destination: "巴黎",
    tags: ["#摄影", "#旅行"],
    author: AURORA,
    created_at: iso(4, 18),
    likes: 198,
    comments: 22,
    collects: 41,
    authorFollowedByMe: true,
  }),
  makeShowcasePost({
    id: "tt-showcase-post-007",
    type: "food",
    content: "祇园附近家庭料理，出汁很干净。老板只会日语，指菜单图片即可。人均演示价仅供参考。#美食 #京都",
    media_url: pick(FOOD_IMAGES_POOL, 4),
    media_urls: [pick(FOOD_IMAGES_POOL, 4), pick(FOOD_IMAGES_POOL, 6), pick(FOOD_IMAGES_POOL, 2)],
    destination: "京都",
    tags: ["#美食", "#京都"],
    author: KENTO,
    created_at: iso(1, 13),
    likes: 76,
    comments: 7,
    collects: 19,
    authorFollowedByMe: true,
  }),
  makeShowcasePost({
    id: "tt-showcase-post-008",
    type: "travel",
    content: "乌布梯田徒步：从 Tegallalang 入口进，中途有凉亭补水。注意防滑鞋。#攻略 #巴厘岛",
    media_url: pick(TRAVEL_IMAGES_POOL, 9),
    media_urls: [pick(TRAVEL_IMAGES_POOL, 9), pick(TRAVEL_IMAGES_POOL, 1)],
    destination: "巴厘岛",
    tags: ["#攻略", "#旅行"],
    author: MEI,
    created_at: iso(5, 9),
    likes: 145,
    comments: 12,
    collects: 28,
    authorFollowedByMe: true,
  }),
  makeShowcasePost({
    id: "tt-showcase-post-009",
    type: "video",
    content: "东京台场夜景延时，彩虹大桥车流像流动的光带。下一支拍晴空塔蓝调时刻。#摄影 #东京",
    media_url: VIDEO_SAMPLES[3],
    cover_url: pick(TRAVEL_IMAGES_POOL, 0),
    is_video: true,
    destination: "东京",
    tags: ["#摄影", "#东京", "#视频"],
    author: YUKI,
    created_at: iso(0, 21),
    likes: 312,
    comments: 28,
    collects: 67,
  }),
  makeShowcasePost({
    id: "tt-showcase-post-010",
    type: "video",
    content: "滨海湾花园超级树灯光秀，建议 19:45 前占位。风大记得带薄外套。#攻略 #新加坡",
    media_url: VIDEO_SAMPLES[2],
    cover_url: pick(TRAVEL_IMAGES_POOL, 10),
    is_video: true,
    destination: "新加坡",
    tags: ["#攻略", "#新加坡", "#视频"],
    author: MEI,
    created_at: iso(1, 20),
    likes: 421,
    comments: 35,
    collects: 88,
    authorFollowedByMe: true,
  }),
];

export function findCommunityShowcasePostById(postId: string): CommunityPost | undefined {
  if (isCommunityContentProductionProfile()) return undefined;
  if (!isShowcasePostId(postId)) return undefined;
  return COMMUNITY_SHOWCASE_POSTS.find((p) => p.id === postId);
}

export function communityShowcasePostsForFeedMode(mode: "follow" | "hot" | "latest"): CommunityPost[] {
  if (mode === "follow") {
    const allow = new Set(SHOWCASE_FOLLOW_AUTHOR_IDS);
    return COMMUNITY_SHOWCASE_POSTS.filter((p) => allow.has(p.author.id));
  }
  return COMMUNITY_SHOWCASE_POSTS;
}

export function showcaseUserToCommunityItem(a: CommunityPostAuthor, follow_status?: CommunityUserItem["follow_status"]): CommunityUserItem {
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
  showcaseUserToCommunityItem(KENTO, "following"),
  showcaseUserToCommunityItem(AURORA, "following"),
  showcaseUserToCommunityItem(MEI, "following"),
];

export const SHOWCASE_FOLLOWERS_USERS: CommunityUserItem[] = [
  showcaseUserToCommunityItem(LIAM, "follower"),
  showcaseUserToCommunityItem(YUKI, "follower"),
  showcaseUserToCommunityItem(AURORA, "follower"),
  showcaseUserToCommunityItem(KENTO, "follower"),
  showcaseUserToCommunityItem(MEI, "follower"),
];

export const SHOWCASE_FRIENDS_USERS: CommunityUserItem[] = [
  showcaseUserToCommunityItem(AURORA, "friend"),
  showcaseUserToCommunityItem(MEI, "friend"),
];

/** 私信列表行（与 messages/page ApiConversationItem 对齐） */
export type ShowcaseConversationRow = {
  id: string;
  peerId: string;
  peerNickname: string;
  peerAvatarUrl: string | null;
  peerRole: string;
  peerIsEscrowGuide?: boolean;
  peerWalletShort?: string | null;
  lastMessage: string;
  lastAt: string;
  unread: number;
};

export const SHOWCASE_CONVERSATIONS: ShowcaseConversationRow[] = [
  {
    id: "tt-showcase-conv-1",
    peerId: KENTO.id,
    peerNickname: KENTO.nickname,
    peerAvatarUrl: KENTO.avatar_url,
    peerRole: "guide",
    peerIsEscrowGuide: true,
    peerWalletShort: wShort,
    lastMessage: "好的，那明天 9:00 三年坂见。我会带便携凳子。",
    lastAt: iso(0, 20),
    unread: 2,
  },
  {
    id: "tt-showcase-conv-2",
    peerId: AURORA.id,
    peerNickname: AURORA.nickname,
    peerAvatarUrl: AURORA.avatar_url,
    peerRole: "traveler",
    peerWalletShort: wShort,
    lastMessage: "胶片冲洗店我发你地图钉了～",
    lastAt: iso(1, 15),
    unread: 0,
  },
  {
    id: "tt-showcase-conv-3",
    peerId: MEI.id,
    peerNickname: MEI.nickname,
    peerAvatarUrl: MEI.avatar_url,
    peerRole: "traveler",
    peerWalletShort: wShort,
    lastMessage: "筑地那家丼饭周二定休，别跑空。",
    lastAt: iso(2, 14),
    unread: 1,
  },
];

export const SHOWCASE_CONV_BY_PEER: Record<string, string> = Object.fromEntries(
  SHOWCASE_CONVERSATIONS.map((c) => [c.peerId, c.id])
);

type ThreadDef = {
  peer: CommunityPostAuthor;
  lines: ReadonlyArray<{ fromPeer: boolean; body: string; offsetMin: number }>;
};

const SHOWCASE_THREAD_DEFS: Record<string, ThreadDef> = {
  "tt-showcase-conv-1": {
    peer: KENTO,
    lines: [
      { fromPeer: true, body: "您好，看到您收藏了我的京都晨走路线，需要我帮您排一下动线吗？", offsetMin: 300 },
      { fromPeer: false, body: "想安排半天东山＋下午宇治，带父母，脚力一般。", offsetMin: 280 },
      { fromPeer: true, body: "建议东山只走「宁宁之道」精华段，宇治选平等院对岸的茶寮休息。", offsetMin: 260 },
      { fromPeer: false, body: "好的，那明天 9:00 三年坂见。我会带便携凳子。", offsetMin: 20 },
    ],
  },
  "tt-showcase-conv-2": {
    peer: AURORA,
    lines: [
      { fromPeer: false, body: "Hi，你上次发的祇园机位太绝了，冲洗有推荐店吗？", offsetMin: 200 },
      { fromPeer: true, body: "谢谢喜欢！我用的是银盐老店，支持 E-6。", offsetMin: 190 },
      { fromPeer: true, body: "胶片冲洗店我发你地图钉了～", offsetMin: 30 },
    ],
  },
  "tt-showcase-conv-3": {
    peer: MEI,
    lines: [
      { fromPeer: true, body: "你问的筑地海鲜下，记得避开周末早高峰。", offsetMin: 120 },
      { fromPeer: false, body: "收到，我打算周二去。", offsetMin: 100 },
      { fromPeer: true, body: "筑地那家丼饭周二定休，别跑空。", offsetMin: 40 },
    ],
  },
};

export function buildShowcaseDmMessages(conversationId: string, meUserId: string): CommunityDmMessageRow[] {
  const def = SHOWCASE_THREAD_DEFS[conversationId];
  if (!def) return [];
  const now = Date.now();
  return def.lines.map((line, i) => {
    const t = new Date(now - line.offsetMin * 60_000).toISOString();
    return {
      id: `${conversationId}-m${i}`,
      conversation_id: conversationId,
      sender_id: line.fromPeer ? def.peer.id : meUserId,
      body: line.body,
      created_at: t,
    };
  });
}

export function getShowcaseThreadPeer(conversationId: string): CommunityPostAuthor | undefined {
  return SHOWCASE_THREAD_DEFS[conversationId]?.peer;
}

/** Curated 演示作者昵称集合（与 PG public showcase seed 对读 · 防混池） */
let showcaseAuthorNicknamesCache: Set<string> | null = null;

export function showcaseAuthorNicknameSet(): ReadonlySet<string> {
  if (!showcaseAuthorNicknamesCache) {
    showcaseAuthorNicknamesCache = new Set(
      COMMUNITY_SHOWCASE_POSTS.map((p) => p.author?.nickname?.trim()).filter((n): n is string => Boolean(n)),
    );
  }
  return showcaseAuthorNicknamesCache;
}

/** PG seed 作者与 client curated 演示 persona 同名但 id 不同 → 展示层视为重复 */
export function isPgSeedDuplicateOfShowcasePersona(
  post: Pick<CommunityPost, "author">,
): boolean {
  const id = post.author?.id ?? "";
  if (isShowcaseAuthorId(id)) return false;
  const nick = post.author?.nickname?.trim();
  if (!nick) return false;
  return showcaseAuthorNicknameSet().has(nick);
}

export function filterPgSeedDuplicatesWhenShowcaseActive(posts: CommunityPost[]): CommunityPost[] {
  if (!shouldUseCommunityShowcaseOnEmpty()) return posts;
  return posts.filter((p) => !isPgSeedDuplicateOfShowcasePersona(p));
}
