/** 17 ① 输入字段（与 04 §三、27-P15 一致） */
export interface ItineraryForm {
  destination: string;
  city: string;
  travel_date: string;
  days: number;
  hotel_type: string;
  food_preference: string;
  transport: string;
  budget_min: string;
  budget_max: string;
  notes: string;
}

/** 17 ① 输出：费用明细（与 52 §3.2 一致） */
export interface AmountBreakdown {
  hotel: number;
  catering: number;
  tickets: number;
  guide_fee: number;
  vehicle: number;
  platform_fee: number;
  total_budget: number;
}

/** 成功响应（17 ① 输出；52 统一表 daily_itinerary + amount_breakdown） */
export interface ItineraryResponse {
  status?: string;
  itinerary_id?: string;
  order_id: string;
  version: number;
  order_status?: string;
  daily_itinerary?: import("@/lib/itineraryUnified").UnifiedDayRow[];
  amount_breakdown: AmountBreakdown;
}

export const defaultForm: ItineraryForm = {
  destination: "",
  city: "",
  travel_date: "",
  days: 3,
  hotel_type: "",
  food_preference: "",
  transport: "",
  budget_min: "",
  budget_max: "",
  notes: "",
};
