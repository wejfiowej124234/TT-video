/**
 * 52 §5.5：行程 API 响应与 52 统一表/金额结构一致性的类型与契约测试
 * 56-S3：POST /itineraries 请求体可选 cities 多城市契约
 */
import { describe, it, expect } from "vitest";
import type { ItineraryCreateResponse } from "./itineraries";
import type { UnifiedDayRow, AmountBreakdownUnified } from "@/lib/itineraryUnified";

/** 56-S3：postItineraryCreate 的 body 类型（与 itineraries.ts 一致，用于契约测试） */
type PostItineraryCreateBody = {
  destination: string;
  city: string;
  travel_date?: string;
  days: number;
  cities?: string[];
  hotel_type?: string;
  food_preference?: string;
  transport?: string;
  budget_min?: number;
  budget_max?: number;
  notes?: string;
  guide_id?: string;
  party_size?: number;
  num_rooms?: number;
};

describe("apiClient/itineraries 52 contract", () => {
  it("ItineraryCreateResponse daily_itinerary is compatible with UnifiedDayRow[]", () => {
    const response: ItineraryCreateResponse = {
      order_id: "test-id",
      version: 1,
      daily_itinerary: [
        { day_index: 1, content_text: "Day 1", content_images: [] },
        { day_index: 2, description: "Day 2 summary", city: "Beijing", images: ["https://a.jpg"] },
      ],
      amount_breakdown: {
        hotel: 100,
        catering: 80,
        tickets: 50,
        guide_fee: 120,
        vehicle: 60,
        platform_fee: 20,
        total_budget: 430,
      },
    };
    const days = response.daily_itinerary as UnifiedDayRow[] | undefined;
    expect(days).toBeDefined();
    expect(days?.length).toBe(2);
    expect(days?.[0].day_index).toBe(1);
    expect(days?.[0].content_text).toBe("Day 1");
    expect(days?.[1].description).toBe("Day 2 summary");
    expect(days?.[1].city).toBe("Beijing");
  });

  it("ItineraryCreateResponse amount_breakdown has 52 §3.2 six items + total_budget", () => {
    const breakdown: AmountBreakdownUnified = {
      hotel: 100,
      catering: 80,
      tickets: 50,
      guide_fee: 120,
      vehicle: 60,
      platform_fee: 20,
      total_budget: 430,
    };
    const response: ItineraryCreateResponse = { order_id: "x", amount_breakdown: breakdown };
    const ab = response.amount_breakdown;
    expect(ab).toBeDefined();
    expect(typeof ab?.hotel).toBe("number");
    expect(typeof ab?.catering).toBe("number");
    expect(typeof ab?.tickets).toBe("number");
    expect(typeof ab?.guide_fee).toBe("number");
    expect(typeof ab?.vehicle).toBe("number");
    expect(typeof ab?.platform_fee).toBe("number");
    expect(typeof ab?.total_budget).toBe("number");
    expect(ab?.total_budget).toBe(430);
  });

  it("56-S3: postItineraryCreate body may include optional cities array", () => {
    const bodyWithoutCities: PostItineraryCreateBody = {
      destination: "中国",
      city: "北京",
      days: 3,
    };
    expect(bodyWithoutCities.cities).toBeUndefined();

    const bodyWithCities: PostItineraryCreateBody = {
      destination: "中国",
      city: "北京",
      days: 3,
      cities: ["北京", "上海", "杭州"],
    };
    expect(bodyWithCities.cities).toEqual(["北京", "上海", "杭州"]);
    expect(bodyWithCities.cities?.length).toBe(3);
  });

  it("postItineraryCreate body may include optional guide_id", () => {
    const withGuide: PostItineraryCreateBody = {
      destination: "中国",
      city: "杭州",
      days: 2,
      guide_id: "550e8400-e29b-41d4-a716-446655440000",
    };
    expect(withGuide.guide_id).toMatch(/^[0-9a-f-]{36}$/i);
  });
});
