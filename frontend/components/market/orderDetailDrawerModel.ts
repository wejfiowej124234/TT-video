import type { AmountBreakdownUnified } from "@/lib/itineraryUnified";
import type { MarketOrderItinerary } from "@/lib/marketTypes";

/** 29 §9、52 §3.2 费用拆分（与统一表金额项顺序一致） */
export interface OrderDetailBreakdown {
  hotel?: number;
  food?: number;
  catering?: number;
  tickets?: number;
  guideFee?: number;
  carFee?: number;
  vehicle?: number;
  misc?: number;
  platform_fee?: number;
  total_budget?: number;
}

export interface TransportLeg {
  from: string;
  to: string;
  type: "vehicle" | "rail" | "flight";
}

export const GUIDE_LEVEL_KEYS: Record<string, string> = {
  primary: "market_guidePrimary",
  intermediate: "market_guideIntermediate",
  advanced: "market_guideAdvanced",
  expert: "market_guideExpert",
};
export const CITY_TRANSPORT_KEYS: Record<string, string> = {
  sedan: "market_transportSedan",
  suv: "market_transportSuv",
  van: "market_transportVan",
};
export const LEG_TYPE_KEYS: Record<string, string> = {
  vehicle: "market_transportVehicle",
  rail: "market_transportRail",
  flight: "market_transportFlight",
};

/** 52：与 `MarketOrderItinerary` 同源（discover / GET order） */
export type OrderDetailItinerary = MarketOrderItinerary;

/** P29 订单详情抽屉：与商家橱窗 / 旅行收购列表详情同壳（`marketDetailDrawerClasses`）；行程、Agreement、托管与 /pay 动线；52 itinerary 统一表 */
export interface OrderDetailItem {
  id: string;
  amount?: string;
  currency?: string;
  /** 与 GET order / discover 同源（04 §3.4） */
  state?: string;
  status?: string;
  destination?: string;
  country?: string;
  city?: string;
  days?: number;
  headcount?: number;
  version?: number;
  image?: string | null;
  escrow_address?: string | null;
  breakdown?: OrderDetailBreakdown | null;
  itinerary?: OrderDetailItinerary | null;
  highlights?: string[] | null;
  transportLegs?: TransportLeg[] | null;
  cityTransports?: string[] | null;
  guideLevel?: string | null;
  /** 53：详情 GET 可带子状态 */
  sub_status?: string;
  /** B-097 */
  display_status?: string | null;
  projection_terminal?: Record<string, unknown> | null;
}

/** 53-S5：向导在右侧弹窗内「确认接该项目」后的回调；成功后可关闭抽屉并刷新列表 */
export type OnConfirmAccept = (orderId: string) => Promise<void>;

/** `useOrderDetailDrawer` 入参（B-069 订单详情抽屉）。 */
export type UseOrderDetailDrawerOptions = {
  order: OrderDetailItem | null;
  loginReturnPath?: string;
  onClose: () => void;
  onConfirmAccept?: OnConfirmAccept;
};

/** 金额展示：保留两位小数，避免 54.599999、7.800000000000001 等浮点噪音 */
export function formatAmount(value: number | undefined | null, dash: string): string {
  if (value == null || Number.isNaN(value)) return dash;
  const n = Math.round(value * 100) / 100;
  return n.toFixed(2);
}

function hasUnifiedAmountBreakdown(ab?: AmountBreakdownUnified | null): boolean {
  if (!ab) return false;
  return (
    ab.hotel != null ||
    ab.catering != null ||
    ab.tickets != null ||
    ab.guide_fee != null ||
    ab.vehicle != null ||
    ab.platform_fee != null ||
    ab.total_budget != null
  );
}

/** 市场列表 discover 项上的 legacy breakdown → 52 §3.2 统一金额项（与 UnifiedItineraryList 一致） */
export function orderBreakdownToAmountUnified(
  b: OrderDetailBreakdown | null | undefined,
): AmountBreakdownUnified | undefined {
  if (!b) return undefined;
  const catering = b.catering ?? b.food;
  const vehicle = b.vehicle ?? b.carFee;
  const platform_fee = b.platform_fee ?? b.misc;
  const out: AmountBreakdownUnified = {
    hotel: b.hotel,
    catering: catering ?? undefined,
    tickets: b.tickets,
    guide_fee: b.guideFee,
    vehicle: vehicle ?? undefined,
    platform_fee: platform_fee ?? undefined,
    total_budget: b.total_budget,
  };
  return hasUnifiedAmountBreakdown(out) ? out : undefined;
}

/** API `amount_breakdown` 优先；缺项用 discover 卡片上的 legacy `breakdown` 补齐（GET 合并后仍可能混源） */
export function mergeAmountBreakdownWithLegacy(
  api: AmountBreakdownUnified | undefined | null,
  legacy: OrderDetailBreakdown | null | undefined,
): AmountBreakdownUnified | undefined {
  const leg = orderBreakdownToAmountUnified(legacy);
  const out: AmountBreakdownUnified = {
    hotel: api?.hotel ?? leg?.hotel,
    catering: api?.catering ?? leg?.catering,
    tickets: api?.tickets ?? leg?.tickets,
    guide_fee: api?.guide_fee ?? leg?.guide_fee,
    vehicle: api?.vehicle ?? leg?.vehicle,
    platform_fee: api?.platform_fee ?? leg?.platform_fee,
    total_budget: api?.total_budget ?? leg?.total_budget,
  };
  return hasUnifiedAmountBreakdown(out) ? out : undefined;
}
