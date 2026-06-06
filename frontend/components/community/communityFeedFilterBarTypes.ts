import type { CommunityPostType } from "@/lib/communityMockData";
import type { FeedTab, SortBy, RegionKey } from "./communityFeedConstants";
import type { LocaleTranslateFn } from "@/lib/i18n";

export interface CommunityFeedFilterBarProps {
  t: LocaleTranslateFn;
  feedTab: FeedTab;
  setFeedTab: (v: FeedTab) => void;
  sortBy: SortBy;
  setSortBy: (v: SortBy) => void;
  typeFilter: CommunityPostType | "all";
  setTypeFilter: (v: CommunityPostType | "all") => void;
  regionFilter: RegionKey;
  setRegionFilter: (v: RegionKey) => void;
  destinationFilter: string;
  setDestinationFilter: (v: string) => void;
  hotDestinations: string[];
  tagFilter: string | null;
  setTagFilter: (v: string | null) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  /** 非 null 时展示 Feed 拉取失败（已为本地化全文，可含 login/限流等映射） */
  feedError: string | null;
  onRefresh: () => void;
  onClearFilters: () => void;
  /** 与 Feed 列表一致：话题筛选时的匹配条数 */
  tagTopicMatchCount?: number;
  /** Enter：将当前搜索词作为服务端 **`tag`**（`GET …/feed?tag=` / 话题路径），与 04、31 附录一致 */
  onSearchApplyServerTag?: () => void;
}
