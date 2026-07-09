/**
 * P29 市场域共享类型：订单卡片、向导卡片等。
 * 放在 lib 层供 components/market 与 lib/marketMockData 共用，满足 43 依赖方向（Lib 不引用 Components）。
 */

import type { AmountBreakdownUnified, UnifiedDayRow } from "@/lib/itineraryUnified";

/** `GET /api/v1/discover/orders` item 之 itinerary 与 `GET /api/v1/orders/:id` 嵌套行程同源（04 §3.4 · 52 §3.1～3.2）；列表 UI 在 `/market` */
export interface MarketOrderItinerary {
  version?: number;
  snapshot_hash?: string | null;
  daily_itinerary?: UnifiedDayRow[];
  amount_breakdown?: AmountBreakdownUnified;
}

/** P29 订单卡片：29 §9 可选费用拆分 */
export interface OrderBreakdown {
  guideFee?: number;
  carFee?: number;
  hotel?: number;
  food?: number;
  tickets?: number;
  misc?: number;
}

/** 段间交通（如 北京→高铁→上海） */
export interface TransportLeg {
  from: string;
  to: string;
  type: "vehicle" | "rail" | "flight";
}

export interface OrderCardItem {
  id: string;
  /** 与列表行 id 可能不同；54-S9 去重优先用此字段（一单多行时稳定） */
  order_id?: string | null;
  /** chain_off `GET /api/v1/discover/orders` 与 `GET /api/v1/orders` 列表参与方键同形（04 §3.4 · 87） */
  tourist_id?: string;
  /** 87：与 `tourist_id` 同 UUID */
  traveler_id?: string;
  guide_id?: string;
  amount?: string;
  currency?: string;
  /** 订单主状态（与 `GET /api/v1/orders`、`GET /api/v1/discover/orders` 列表字段同源；市场 UI 为 `/market`） */
  status?: string;
  state?: string;
  /** 53：与 status 配合展示（如 guide_claimed、pending_bilateral） */
  sub_status?: string;
  destination?: string;
  country?: string;
  /** discover：`derive_route_label_from_days`（如 北京、上海、杭州） */
  route_label?: string;
  city?: string;
  days?: number;
  /** 出行日（列表与 GET order 同源） */
  travel_date?: string | null;
  headcount?: number;
  version?: number;
  image?: string | null;
  /** GET orders / discover 与详情同源（04 §3.4 · 56-S11） */
  escrow_address?: string | null;
  breakdown?: OrderBreakdown | null;
  /** chain_off discover 与 GET order 对齐时可内嵌，减少抽屉内二次请求 */
  itinerary?: MarketOrderItinerary | null;
  highlights?: string[] | null;
  transportLegs?: TransportLeg[] | null;
  guideLevel?: string | null;
  cityTransports?: string[] | null;
  /** 用于排序：最新优先 */
  created_at?: string | null;
  /** Phase 0+1：公众展示数据分离（`GET discover/orders` / `GET orders`） */
  data_origin?: string | null;
}

/** P29 向导卡片：29 §9 可选报价范围 */
export interface GuidePriceRange {
  guideFeePerDay?: number | string;
  carFeePerDay?: number | string;
}

export interface GuideCardItem {
  id: string;
  user_id?: string;
  city?: string;
  country_code?: string;
  languages?: string[];
  service_types?: string[];
  bio?: string | null;
  stake_amount?: string;
  hourly_rate?: string;
  hourly_currency?: string;
  avatar_url?: string | null;
  public_title?: string | null;
  status?: string;
  created_at?: string;
  priceRange?: GuidePriceRange | null;
  rating?: number | null;
  completedCount?: number | null;
  responseSLA?: string | null;
  /** Phase 0+1：公众展示数据分离（`GET guides` 列表卡） */
  data_origin?: string | null;
}
