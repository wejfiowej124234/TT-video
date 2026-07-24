import type { CommunityPostType } from "@/lib/communityMockData";
import { communityCardLinkFocus } from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";
import { PRODUCT_COUNTRIES } from "@/lib/productCountries";

export type FeedTab = "recommend" | "following";
export type SortBy = "latest" | "hot";

export const TYPE_OPTIONS: CommunityPostType[] = ["photo", "video", "food", "travel", "text"];

/**
 * Feed 目的地 · 产品十国精选城（每国 ≤4 · 与 productCountries / preset_cities 同源）
 * **禁止** 印尼 / `id`。
 */
export const DESTINATION_CITY_BY_REGION: Record<string, string[]> = {
  cn: ["北京", "上海", "杭州", "成都"],
  jp: ["东京", "大阪", "京都"],
  kr: ["首尔", "釜山", "济州"],
  sg: ["新加坡"],
  th: ["曼谷", "清迈", "普吉"],
  ae: ["迪拜", "阿布扎比"],
  us: ["纽约", "洛杉矶", "旧金山"],
  au: ["悉尼", "墨尔本"],
  fr: ["巴黎", "里昂"],
  es: ["马德里", "巴塞罗那"],
};

/** 含国家名（PublishDrawer）+ 城市；顺序跟 PRODUCT_COUNTRIES */
export const DESTINATION_BY_REGION: Record<string, string[]> = Object.fromEntries(
  PRODUCT_COUNTRIES.map((c) => {
    const regionKey = c.iso.toLowerCase();
    const cities = DESTINATION_CITY_BY_REGION[regionKey] ?? [];
    return [regionKey, [c.nameZh, ...cities]];
  }),
);

/** City chips only (exclude country aliases) for hot-destination rows */
export const KNOWN_DESTINATION_CITIES: ReadonlySet<string> = new Set(
  Object.values(DESTINATION_CITY_BY_REGION).flat(),
);

/** PublishDrawer 目的地选项（与 Feed 筛选 `DESTINATION_BY_REGION` 同源） */
export const PUBLISH_DESTINATION_OPTIONS: string[] = [
  ...new Set(Object.values(DESTINATION_BY_REGION).flat()),
];

/** Feed 筛选用城市 flat 列表（不含国家名） */
export const FEED_DESTINATION_CITY_OPTIONS: string[] = [
  ...new Set(Object.values(DESTINATION_CITY_BY_REGION).flat()),
];

/** Feed 目的地分组（十国 · 仅城市 · App-style IA） */
export const FEED_DESTINATION_GROUPS: { regionKey: string; cities: string[] }[] =
  PRODUCT_COUNTRIES.map((c) => {
    const regionKey = c.iso.toLowerCase();
    return {
      regionKey,
      cities: DESTINATION_CITY_BY_REGION[regionKey] ?? [],
    };
  });

export function communityFeedDestinationLabel(
  t: (key: string, vars?: Record<string, string | number>) => string,
  dest: string,
): string {
  const key = DESTINATION_LABEL_KEYS[dest];
  return key ? t(key) : dest;
}

/** 目的地展示 i18n：中文名 -> locale key（用于筛选栏与卡片展示） */
export const DESTINATION_LABEL_KEYS: Record<string, string> = {
  中国: "community_region_cn",
  日本: "community_region_jp",
  韩国: "community_region_kr",
  新加坡: "community_dest_singapore",
  泰国: "community_region_th",
  阿联酋: "community_region_ae",
  美国: "community_region_us",
  澳大利亚: "community_region_au",
  法国: "community_region_fr",
  西班牙: "community_region_es",
  北京: "community_dest_beijing",
  上海: "community_dest_shanghai",
  杭州: "community_dest_hangzhou",
  成都: "community_dest_chengdu",
  东京: "community_dest_tokyo",
  大阪: "community_dest_osaka",
  京都: "community_dest_kyoto",
  首尔: "community_dest_seoul",
  釜山: "community_dest_busan",
  济州: "community_dest_jeju",
  曼谷: "community_dest_bangkok",
  清迈: "community_dest_chiangmai",
  普吉: "community_dest_phuket",
  迪拜: "community_dest_dubai",
  阿布扎比: "community_dest_abudhabi",
  纽约: "community_dest_newyork",
  洛杉矶: "community_dest_losangeles",
  旧金山: "community_dest_sanfrancisco",
  悉尼: "community_dest_sydney",
  墨尔本: "community_dest_melbourne",
  巴黎: "community_dest_paris",
  里昂: "community_dest_lyon",
  马德里: "community_dest_madrid",
  巴塞罗那: "community_dest_barcelona",
};

/** 地区 chip · 十国 ISO 小写 + all（无印尼） */
export const REGION_KEYS = [
  "all",
  "cn",
  "jp",
  "kr",
  "sg",
  "th",
  "ae",
  "us",
  "au",
  "fr",
  "es",
] as const;
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
