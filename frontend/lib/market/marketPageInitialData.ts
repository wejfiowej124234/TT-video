import type { OrderCardItem } from "@/lib/marketTypes";
import type { GuideCardItem } from "@/components/market/GuideCard";

/** `/market` 首屏 SSR 快照（仅默认无筛选 query · ① 本地） */
export type MarketPageInitialSnapshot = {
  orders: OrderCardItem[];
  guides: GuideCardItem[];
  ordersNextCursor: string | null;
  ordersHasMore: boolean;
  guidesNextCursor: string | null;
  guidesHasMore: boolean;
};
