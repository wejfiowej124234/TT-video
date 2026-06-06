import { COMMUNITY_FEED_LIST_API_MAX } from "@/lib/apiClient/community";

/** 31 §2.1 P3：发现页——热门目的地入口（`?destination=`）+ 话题入口（`/community/topic/…`）+ 推荐作者网格；`pathTag` 与历史分享 URL 一致，标签文案走 i18n。 */
export const EXPLORE_TOPIC_LINKS = [
  { pathTag: "旅行", labelKey: "community_explore_topic_label_travel" },
  { pathTag: "美食", labelKey: "community_explore_topic_label_food" },
  { pathTag: "摄影", labelKey: "community_explore_topic_label_photo" },
  { pathTag: "攻略", labelKey: "community_explore_topic_label_guide" },
] as const;

export const COMMUNITY_EXPLORE_FEED_QUERY_KEY = ["community", "exploreFeed"] as const;

export const EXPLORE_FEED_STALE_MS = 60_000;
/** 产品默认 24；与 **`GET …/feed`** `limit.min(100)` 同源钳位（`COMMUNITY_FEED_LIST_API_MAX`）。 */
export const EXPLORE_FEED_PAGE_SIZE = Math.min(24, COMMUNITY_FEED_LIST_API_MAX);
/** 瀑布流缩略图上限：首屏 + 每多一页 +24，封顶 120 */
export const EXPLORE_MASONRY_CAP_MAX = 120;
export const EXPLORE_MASONRY_MORE_PER_PAGE = Math.min(24, COMMUNITY_FEED_LIST_API_MAX);
