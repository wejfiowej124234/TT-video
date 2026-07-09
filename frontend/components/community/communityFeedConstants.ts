import type { CommunityPostType } from "@/lib/communityMockData";
import { communityCardLinkFocus } from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";

export type FeedTab = "recommend" | "following";
export type SortBy = "latest" | "hot";

export const TYPE_OPTIONS: CommunityPostType[] = ["photo", "video", "food", "travel", "text"];

/** 目的地按地区分类（筛选用）；区域标签已走 community_region_* i18n */
export const DESTINATION_BY_REGION: Record<string, string[]> = {
  cn: ["厦门", "丽江", "北京", "上海", "成都", "杭州"],
  jp: ["富士山", "大阪", "东京", "京都"],
  th: ["清迈", "曼谷", "普吉"],
  id: ["巴厘岛", "雅加达"],
  sg: ["新加坡"],
};

/** PublishDrawer 目的地选项（与 Feed 筛选 `DESTINATION_BY_REGION` 同源） */
export const PUBLISH_DESTINATION_OPTIONS: string[] = [
  ...new Set(Object.values(DESTINATION_BY_REGION).flat()),
];

/** 目的地展示 i18n：中文名 -> locale key（用于筛选栏与卡片展示） */
export const DESTINATION_LABEL_KEYS: Record<string, string> = {
  厦门: "community_dest_xiamen",
  丽江: "community_dest_lijiang",
  北京: "community_dest_beijing",
  上海: "community_dest_shanghai",
  成都: "community_dest_chengdu",
  杭州: "community_dest_hangzhou",
  富士山: "community_dest_fuji",
  大阪: "community_dest_osaka",
  东京: "community_dest_tokyo",
  京都: "community_dest_kyoto",
  清迈: "community_dest_chiangmai",
  曼谷: "community_dest_bangkok",
  普吉: "community_dest_phuket",
  巴厘岛: "community_dest_bali",
  雅加达: "community_dest_jakarta",
  新加坡: "community_dest_singapore",
};

export const REGION_KEYS = ["all", "cn", "jp", "th", "id", "sg"] as const;
export type RegionKey = (typeof REGION_KEYS)[number];

export const FEED_PAGE_SIZE = 6;
/** 乐观评论 id 前缀（`useCommunityFeedCommentSend` · `communityFeedMappersCounts` 同源） */
export const COMMUNITY_COMMENT_OPTIMISTIC_ID_PREFIX = "comment-local-";
/** @deprecated Local demo only — do not use in production surfaces; use governed API media URLs. */
export const TRAVEL_IMG = "";

/** 31 §2.4：评论/详情内「约 TA 当向导」pill，与 Feed 卡片 `CommunityFeedCardContent` 一致；**37** **`min-h-[44px]`** */
export const COMMUNITY_BOOK_GUIDE_CTA_CLASS = `${TT_COMMUNITY_PAGE_L5.pill} shrink-0 ${communityCardLinkFocus}`;

/** 会话列表等窄行：同语义，**44px** 触摸目标 + 文案过长时截断 */
export const COMMUNITY_BOOK_GUIDE_CTA_CLASS_COMPACT = `${TT_COMMUNITY_PAGE_L5.pillCompact} max-w-[9rem] truncate ${communityCardLinkFocus}`;
