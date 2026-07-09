import { describe, expect, it } from "vitest";
import {
  filterGuidePublicServiceTypes,
  formatGuideHourlyRateLabel,
  formatGuideLanguages,
  formatGuidePublicBio,
  formatGuideServiceTypeLabel,
  isInternalGuideServiceType,
  isInternalMarketSeedCopy,
  resolveMarketOrderCardTeaser,
} from "./marketDisplayCopy";
import type { OrderCardItem } from "@/lib/marketTypes";

const t = (key: string) =>
  ({
    market_order_teaser_itinerary_line: "{{country}} · {{days}}天 · {{route}}",
    market_order_teaser_country_fallback: "行程",
    market_guide_service_culture: "Culture",
    guide_card_perHour: "{{amount}} {{currency}}/hr",
    guide_card_perHour_on_request: "{{amount}}/hr · on request",
  })[key] ?? key;

describe("marketDisplayCopy", () => {
  it("flags internal seed bios and smoke placeholders", () => {
    expect(isInternalMarketSeedCopy("PD-009 acquisition fulfillment (auto-provisioned)")).toBe(true);
    expect(isInternalMarketSeedCopy("smoke save")).toBe(true);
    expect(isInternalMarketSeedCopy("多重身份演示 · 向导轨")).toBe(true);
    expect(isInternalMarketSeedCopy("五日文化线 · 故宫深度游")).toBe(false);
  });

  it("formatGuidePublicBio hides internal bios", () => {
    expect(formatGuidePublicBio("PD-009 acquisition fulfillment (auto-provisioned)")).toBeNull();
    expect(formatGuidePublicBio("十年本地向导 · 博物馆讲解")).toBe("十年本地向导 · 博物馆讲解");
    expect(formatGuidePublicBio("测试向导账号, 用于联调")).toBeNull();
    expect(formatGuidePublicBio("trust-gate e2e")).toBeNull();
  });

  it("formatGuideLanguages maps locale codes", () => {
    const t2 = (key: string) =>
      ({ market_guide_lang_zh: "中文", market_guide_lang_en: "English" })[key] ?? key;
    expect(formatGuideLanguages(["zh", "en"], t2)).toBe("中文 · English");
    expect(formatGuideLanguages(["fr"], t2)).toBe("FR");
  });

  it("filterGuidePublicServiceTypes drops internal slugs and dedupes", () => {
    expect(
      filterGuidePublicServiceTypes(["acquisition_fulfillment", "walking", "Walking", "smoke_tag", "playmate"]),
    ).toEqual(["walking"]);
    expect(isInternalGuideServiceType("acquisition_fulfillment")).toBe(true);
    expect(isInternalGuideServiceType("playmate")).toBe(true);
  });

  it("formatGuideHourlyRateLabel avoids engineering currency placeholders", () => {
    expect(formatGuideHourlyRateLabel({ hourly_rate: "50", hourly_currency: "USDC" }, t)).toBe("50 USDC/hr");
    expect(formatGuideHourlyRateLabel({ hourly_rate: "50", hourly_currency: "" }, t)).toBe("50/hr · on request");
  });

  it("formatGuideServiceTypeLabel maps known slugs and humanizes unknown", () => {
    expect(formatGuideServiceTypeLabel("culture", t)).toBe("Culture");
    expect(formatGuideServiceTypeLabel("custom_tour", t)).toBe("Custom Tour");
  });

  it("resolveMarketOrderCardTeaser replaces smoke save with itinerary line", () => {
    const item: OrderCardItem = {
      id: "o1",
      destination: "中国 · 北京",
      country: "中国",
      city: "北京",
      route_label: "北京",
      days: 5,
      itinerary: {
        daily_itinerary: [{ day_index: 1, description: "smoke save" }],
      },
    };
    expect(resolveMarketOrderCardTeaser(item, t)).toBe("中国 · 5天 · 北京");
  });
});
