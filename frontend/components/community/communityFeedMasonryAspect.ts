import type { CommunityPost } from "@/lib/communityMockData";

/** 同类型内按 post.id 微变比例 · 三列瀑布高低错落（美团式） */
function masonryAspectVariant(postId: string, options: readonly string[]): string {
  if (options.length === 0) return "aspect-[4/5]";
  let h = 0;
  for (let i = 0; i < postId.length; i++) {
    h = (Math.imul(31, h) + postId.charCodeAt(i)) >>> 0;
  }
  return options[h % options.length] ?? options[0];
}

/** 瀑布卡媒体比例 · 类型桶 + id 微变（CSS columns 自然错落） */
export function communityFeedMasonryMediaAspectClass(
  post: Pick<CommunityPost, "id" | "type" | "is_video">,
): string {
  if (post.is_video === true || post.type === "video") {
    return masonryAspectVariant(post.id, ["aspect-[9/16]", "aspect-[4/5]", "aspect-[3/4]"] as const);
  }
  if (post.type === "food") {
    return masonryAspectVariant(post.id, ["aspect-square", "aspect-[4/5]", "aspect-[3/4]"] as const);
  }
  if (post.type === "photo") {
    return masonryAspectVariant(post.id, ["aspect-[3/4]", "aspect-[4/5]", "aspect-[5/6]"] as const);
  }
  if (post.type === "travel") {
    return masonryAspectVariant(post.id, ["aspect-[5/6]", "aspect-[4/5]", "aspect-[3/4]"] as const);
  }
  return masonryAspectVariant(post.id, ["aspect-[4/5]", "aspect-[3/4]", "aspect-[5/6]"] as const);
}

/** 热榜行展示用 · 稳定伪随机评分（① 本地占位，非真实 POI 数据） */
export function communityFeedPromoHotScore(rankIndex: number): string {
  return (4.9 - rankIndex * 0.15).toFixed(1);
}

/** 热榜行展示用 · 稳定伪随机打卡量 */
export function communityFeedPromoHotCheckins(rankIndex: number): number {
  return Math.max(320, 1520 - rankIndex * 380);
}
