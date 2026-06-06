import { describe, expect, it } from "vitest";
import {
  filterGuidePublicServiceTypes,
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
  })[key] ?? key;

describe("marketDisplayCopy", () => {
  it("flags internal seed bios and smoke placeholders", () => {
    expect(isInternalMarketSeedCopy("PD-009 acquisition fulfillment (auto-provisioned)")).toBe(true);
    expect(isInternalMarketSeedCopy("smoke save")).toBe(true);
    expect(isInternalMarketSeedCopy("五日文化线 · 故宫深度游")).toBe(false);
  });

  it("formatGuidePublicBio hides internal bios", () => {
    expect(formatGuidePublicBio("PD-009 acquisition fulfillment (auto-provisioned)")).toBeNull();
    expect(formatGuidePublicBio("十年本地向导 · 博物馆讲解")).toBe("十年本地向导 · 博物馆讲解");
    expect(formatGuidePublicBio("测试向导账号, 用于联调")).toBeNull();
  });

  it("filterGuidePublicServiceTypes drops internal slugs and dedupes", () => {
    expect(
      filterGuidePublicServiceTypes(["acquisition_fulfillment", "walking", "Walking", "smoke_tag"]),
    ).toEqual(["walking"]);
    expect(isInternalGuideServiceType("acquisition_fulfillment")).toBe(true);
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
