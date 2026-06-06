import type { MarketOrderItinerary, OrderBreakdown } from "../../marketTypes";
import type { ReviewJsonContractClientView } from "../../reviewJsonContract";

/** `GET /api/v1/orders`；不传 limit 时后端全量返回（兼容）；传 limit/cursor 时分页（55 / 04） */
export type OrdersListResult = {
  items: unknown[];
  page?: { limit: number; next_cursor: string | null; has_more: boolean };
};

/** GET /api/v1/orders 列表项（image / escrow_address 与 Discover、详情同源，见 04 §3.4；chain_off 下有行程时含 breakdown/itinerary 与 discover 同形） */
export type OrderListItem = {
  id: string;
  state?: string;
  status?: string;
  /** 53：与主状态配合展示文案；列表接口可选返回 */
  sub_status?: string;
  amount?: string;
  currency?: string;
  destination?: string;
  city?: string;
  country?: string;
  travel_date?: string | null;
  days?: number;
  image?: string | null;
  escrow_address?: string | null;
  /** 列表与 GET order 同源时由 API 返回（托管预填等） */
  tourist_id?: string;
  /** 87：与 `tourist_id` 同 UUID（chain_off 镜像） */
  traveler_id?: string;
  guide_id?: string;
  created_at?: string;
  breakdown?: OrderBreakdown | null;
  itinerary?: MarketOrderItinerary | null;
  /** B-097：有 **`orders_projection`** 时由 API 给出；徽章以之为 SSOT */
  display_status?: string | null;
  /** B-097：链上投影终端；**`null`** 表示无投影行；**`read_status: degraded`** 表示读库失败 */
  projection_terminal?: Record<string, unknown> | null;
  /** 业务线（列表与 chain_off 同源；`communityMeOrdersDrawerModel` / 04 对读） */
  business_line?: string;
};

/** `GET /orders/:id/reviews` 列表项（04 §3.4；含 `weight`） */
export type OrderReviewListItem = {
  id?: string;
  order_id?: string;
  reviewer_id: string;
  reviewee_id: string;
  score: number;
  weight?: number;
  comment?: string | null;
  created_at?: string;
};

/** **`meta.review_json_contract`**（B-451；与 `GET`/`POST …/reviews` 同源） */
export type OrderReviewJsonContractMeta = {
  schema_version: number;
  anchor: string;
};

/** 与响应 `meta` 同源（`review_weight_rule_*` + `review_json_contract`） */
export type OrderReviewsListMeta = {
  review_weight_rule_version?: string;
  review_weight_rule?: string;
  review_json_contract?: OrderReviewJsonContractMeta;
};

export type OrderReviewsListResult = {
  items: OrderReviewListItem[];
  meta?: OrderReviewsListMeta;
  /** B-452：与 `meta` 同源解析，供 UI/日志做版本化降级 */
  reviewJsonContractClient: ReviewJsonContractClientView;
};

/** `POST …/reviews` 成功体 `review.weight_breakdown`（与 `traveltrust_core::ReviewWeightBreakdown` 对齐） */
export type OrderReviewWeightBreakdown = {
  rule_version: string;
  order_amount: number;
  account_age_days: number;
  amount_factor: number;
  age_factor: number;
  weight: number;
  guide_historical_score_reserved: number;
};

/** `POST …/reviews` **200** **`review`** **（** **B-449/B-450** **：** **首次成功** **`weight_breakdown`** **object** **且** **无** **`weight_breakdown_note`** **；** **幂等** **`weight_breakdown`** **null** **且** **`weight_breakdown_note`** **=** **`persisted_review_inputs_not_replayed`** **）** */
export type OrderReviewSubmitReview = {
  id: string;
  order_id: string;
  tourist_id: string;
  traveler_id: string;
  score: number;
  weight: number;
  weight_breakdown: OrderReviewWeightBreakdown | null;
  weight_breakdown_note?: "persisted_review_inputs_not_replayed";
};

export type OrderReviewSubmitOk = {
  status: "ok";
  /** B-451：与 `GET …/reviews` `meta.review_json_contract` 同源 */
  meta?: {
    review_json_contract?: OrderReviewJsonContractMeta;
  };
  review: OrderReviewSubmitReview;
};

/** B-452：`postReview` 成功体 + 客户端合约视图 */
export type OrderReviewPostResult = OrderReviewSubmitOk & {
  reviewJsonContractClient: ReviewJsonContractClientView;
};
