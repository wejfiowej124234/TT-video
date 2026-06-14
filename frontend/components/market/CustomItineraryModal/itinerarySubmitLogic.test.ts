import { describe, expect, it } from "vitest";
import { defaultForm } from "./types";
import {
  buildCustomApiBreakdown,
  buildTouristCustomBody,
  GUIDE_ASSIST_TRANSPORT_TAG,
  resolveItineraryDescription,
  validateAndBuildTourist,
} from "./itinerarySubmitLogic";

const t = (key: string) =>
  (
    ({
      market_defaultTitle: "{{city}} {{days}}天",
      market_listSeparator: "、",
      market_highlightAttractions: "景区：",
      market_highlightFood: "美食：",
      market_highlightHotel: "酒店：",
      market_dayN: "第{n}天",
    }) as Record<string, string>
  )[key] ?? key;

describe("resolveItineraryDescription", () => {
  it("勾选代订时写入订票协助标签", () => {
    const form = { ...defaultForm(), guideAssistTransport: true };
    expect(resolveItineraryDescription(form)).toBe(GUIDE_ASSIST_TRANSPORT_TAG);
  });

  it("已有描述时前缀标签", () => {
    const form = {
      ...defaultForm(),
      guideAssistTransport: true,
      description: "希望上午出发",
    };
    expect(resolveItineraryDescription(form)).toBe(
      `${GUIDE_ASSIST_TRANSPORT_TAG}\n希望上午出发`
    );
  });

  it("未勾选时不改动描述", () => {
    const form = { ...defaultForm(), description: "仅备注" };
    expect(resolveItineraryDescription(form)).toBe("仅备注");
  });
});

describe("validateAndBuildTourist highlights & breakdown", () => {
  it("uses human hotel labels instead of tier_economy in highlights", () => {
    const form = defaultForm(1);
    form.country = "中国";
    form.dayPlans[0].city = "北京";
    form.dayPlans[0].hotel = "tier_economy";
    form.amount = "5000";
    const result = validateAndBuildTourist(form, t, "", 0);
    expect("item" in result).toBe(true);
    if (!("item" in result)) return;
    const text = (result.item.highlights ?? []).join(" ");
    expect(text).toContain("经济型酒店");
    expect(text).not.toContain("tier_economy");
  });

  it("buildCustomApiBreakdown includes attractions_fee, food_fee, hotel_fee", () => {
    const form = defaultForm(1);
    form.country = "中国";
    form.dayPlans[0].city = "北京";
    form.dayPlans[0].attractions = ["故宫"];
    form.dayPlans[0].food = ["烤鸭"];
    form.dayPlans[0].hotel = "tier_comfort";
    const breakdown = buildCustomApiBreakdown(form, 80, {
      attractionsTotal: 18,
      foodTotal: 10,
      hotelTotal: 83,
      hotelNights: 1,
      transportTotal: 80,
      guideTotal: 150,
      total: 341,
      perDay: 341,
      days: 1,
      headcount: 1,
      attractionCount: 1,
      foodCount: 1,
    });
    expect(breakdown?.attractions_fee).toBe(18);
    expect(breakdown?.food_fee).toBe(10);
    expect(breakdown?.hotel_fee).toBe(83);
    expect(breakdown?.car_fee).toBe(80);
  });

  it("buildTouristCustomBody forwards extended breakdown to API body", () => {
    const form = defaultForm(1);
    form.country = "中国";
    form.dayPlans[0].city = "北京";
    form.dayPlans[0].attractions = ["故宫"];
    form.amount = "2000";
    const body = buildTouristCustomBody(form, 0);
    expect(body.breakdown?.attractions_fee).toBeGreaterThan(0);
    expect(body.breakdown?.guide_fee).toBeGreaterThan(0);
  });
});
