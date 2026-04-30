/**
 * DID 排行榜：与 `GET /api/v1/did-rank/*` 对齐的 TypeScript 类型（SSOT：后端 `routes/did_rank.rs`）。
 * 与 `didRankMockData.ts` 中的本地演示生成器分离，避免「Mock」命名误导生产消费路径。
 */

export interface TravelerRankItem {
  id: string;
  rank: number;
  nickname: string;
  /** 登录且与当前会话用户 id 一致时由 API 置 true */
  is_me?: boolean;
  avatar_url?: string | null;
  /** 窗口内已完成订单数（`GET …/did-rank/travelers`；chain_off / DB 同源） */
  completed_orders?: number;
  totalSpentUsdt: number;
  countriesCount: number;
  citiesCount: number;
  /** 战绩：去过的国家（前若干） */
  countries?: string[];
  /** 战绩：去过的城市（前若干） */
  cities?: string[];
}

export interface GuideRankItem {
  id: string;
  rank: number;
  nickname: string;
  /** 登录且与当前会话用户 id 一致时由 API 置 true */
  is_me?: boolean;
  avatar_url?: string | null;
  city?: string;
  totalAmountUsdt: number;
  receptionCount: number;
  /** `GET …/did-rank/guides`：窗口内已完成订单上、评价对象为向导用户的条数（04 附录 §2 / §3.1 Partial） */
  receivedReviewCount?: number;
  /** 上列评价的算术均分；无评价时 API 可能显式 `null` */
  avgReceivedReviewScore?: number | null;
}

/** 行程排行榜项：按使用次数、评价等多指标综合排名，前 10 奖励创作者治理币 */
export interface ItineraryRankItem {
  id: string;
  rank: number;
  title: string;
  /** 登录且为关联订单的旅行者时由 API 置 true */
  is_me?: boolean;
  creatorName: string;
  creatorType: "traveler" | "guide";
  useCount: number;
  rating: number;
  reviewCount: number;
  coverImage?: string | null;
  /** 目的地摘要，如 "北京·上海·西安" */
  destination?: string;
  /** 与 `community/user/[id]` 对齐的创作者用户 UUID；有值且通过 `isDidRankCommunityProfileId` 时行程卡展示档案链 */
  creatorCommunityUserId?: string | null;
}
