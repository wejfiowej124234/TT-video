/**
 * 52 阶段：统一行程表类型（§3.1 按日行、§3.2 金额）
 * 与后端 days_json / amount_breakdown 及 42 弹窗一致
 */

/** 52 §3.2 独立金额项 + 整个行程总金额 */
export interface AmountBreakdownUnified {
  hotel?: number;
  catering?: number;
  tickets?: number;
  guide_fee?: number;
  vehicle?: number;
  platform_fee?: number;
  total_budget?: number;
}

/** 景区单元：名称 + 文字介绍 + 可选配图（52 §3.0 图文配合）；§8.3 可选扩展 */
export interface AttractionItem {
  name: string;
  intro?: string;
  image?: string;
  /** 52-S12c 可选：地图链接 */
  map_link?: string;
  /** §8.3 可选：预计游玩时长，如 "2h" / "半天" */
  duration_estimate?: string;
  /** §8.3 可选：开放时间 */
  open_hours?: string;
  /** §8.3 可选：预约链接 */
  reservation_link?: string;
}

/** 餐饮单元；§8.3 可选扩展 */
export interface DiningItem {
  name: string;
  description?: string;
  image?: string;
  type?: string;
  price?: number;
  /** 52-S12c 可选：地图链接 */
  map_link?: string;
  /** §8.3 可选：营业时间 */
  open_hours?: string;
  /** §8.3 可选：预约链接 */
  reservation_link?: string;
}

/** 52 §3.1 单日行程行（统一表）：兼容旧版 content_text / content_images */
export interface UnifiedDayRow {
  day_index: number;
  date?: string;
  city?: string;
  /** 当日行程文字描述；兼容旧字段 content_text */
  description?: string;
  content_text?: string;
  /** 当日图片列表；兼容旧字段 content_images */
  images?: string[] | { url: string; caption?: string }[];
  content_images?: string[];
  attractions?: AttractionItem[] | string[];
  dining?: DiningItem[] | string[];
  city_transport?: string | { type?: string; desc?: string; image?: string };
  inter_city_transport?: string | { from?: string; to?: string; type?: string; note?: string; image?: string };
  hotel?: string | { name?: string; area?: string; price?: number; intro?: string; image?: string };
  price_note?: string | number;
  notes?: string;
}

/** 取当日描述：优先 description，否则 content_text */
export function getDayDescription(row: UnifiedDayRow): string {
  return row.description ?? row.content_text ?? "";
}

/** 取当日图片列表：优先 images，否则 content_images */
export function getDayImages(row: UnifiedDayRow): string[] {
  const imgs = row.images ?? row.content_images;
  if (!imgs?.length) return [];
  return imgs.map((x) => (typeof x === "string" ? x : (x as { url: string }).url));
}
