/**
 * 社区 showcase 演示帖子与关注流过滤（见根 {@link communityShowcase} 文档块）。
 */
import type { CommunityPost } from "@/lib/communityMockData";
import { FOOD_IMAGES_POOL, TRAVEL_IMAGES_POOL, pick } from "@/lib/communityMockData/constants";
import {
  SHOWCASE_AUTHOR_AURORA,
  SHOWCASE_AUTHOR_KENTO,
  SHOWCASE_AUTHOR_LIAM,
  SHOWCASE_AUTHOR_MEI,
  SHOWCASE_AUTHOR_YUKI,
  showcaseDemoIso,
} from "@/lib/communityShowcaseAuthors";

const VIDEO_SAMPLES = [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
] as const;

/**
 * 关注流演示帖作者 id（仅 **`communityShowcasePostsForFeedMode("follow")`** 过滤 showcase 帖子用）。
 * **不**写入 **`useCommunityFeed`** 的 `followingIds`（须与 **`GET …/me/following`** 真值一致）。
 */
export const SHOWCASE_FOLLOW_AUTHOR_IDS: readonly string[] = [
  "tt-demo-kento",
  "tt-demo-aurora",
  "tt-demo-mei",
];

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
    author: SHOWCASE_AUTHOR_AURORA,
    created_at: showcaseDemoIso(1, 8),
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
    author: SHOWCASE_AUTHOR_KENTO,
    created_at: showcaseDemoIso(0, 19),
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
    author: SHOWCASE_AUTHOR_MEI,
    created_at: showcaseDemoIso(2, 11),
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
    author: SHOWCASE_AUTHOR_LIAM,
    created_at: showcaseDemoIso(3, 16),
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
    author: SHOWCASE_AUTHOR_YUKI,
    created_at: showcaseDemoIso(0, 12),
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
    author: SHOWCASE_AUTHOR_AURORA,
    created_at: showcaseDemoIso(4, 18),
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
    author: SHOWCASE_AUTHOR_KENTO,
    created_at: showcaseDemoIso(1, 13),
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
    author: SHOWCASE_AUTHOR_MEI,
    created_at: showcaseDemoIso(5, 9),
    likes: 145,
    comments: 12,
    collects: 28,
    authorFollowedByMe: true,
  }),
];

export function communityShowcasePostsForFeedMode(mode: "follow" | "hot" | "latest"): CommunityPost[] {
  if (mode === "follow") {
    const allow = new Set(SHOWCASE_FOLLOW_AUTHOR_IDS);
    return COMMUNITY_SHOWCASE_POSTS.filter((p) => allow.has(p.author.id));
  }
  return COMMUNITY_SHOWCASE_POSTS;
}
