/**
 * Custom Itinerary W3 catalog UI · 报价仍 TS · geo/POI 展示接线
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { defaultForm } from "./types";
import { useQuoteCalculation } from "./useQuoteCalculation";
import { getAttractionDetails } from "@/lib/cityDetails";

vi.mock("@/lib/catalogApi/client", () => ({
  isCatalogApiEnabled: vi.fn(() => false),
}));

vi.mock("@/lib/catalogApi/resolve", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/catalogApi/resolve")>();
  return {
    ...actual,
    resolveCatalogCities: vi.fn(actual.resolveCatalogCities),
    resolveCatalogCountries: vi.fn(actual.resolveCatalogCountries),
    resolveCatalogPoiDetails: vi.fn(actual.resolveCatalogPoiDetails),
  };
});

import { isCatalogApiEnabled } from "@/lib/catalogApi/client";
import { useCatalogCityOptions } from "@/lib/catalogApi/useCatalogGeo";
import { useCatalogPoiDetails } from "@/lib/catalogApi/useCatalogPoi";

describe("CustomItineraryModal catalog UI (W3)", () => {
  beforeEach(() => {
    vi.mocked(isCatalogApiEnabled).mockReturnValue(false);
  });

  it("flag=0: city options match TS for 中国", () => {
    const { result } = renderHook(() => useCatalogCityOptions("中国"));
    expect(result.current.length).toBeGreaterThan(0);
    expect(result.current.some((c) => c.value === "北京")).toBe(true);
  });

  it("flag=0: POI options match TS 北京 attractions", () => {
    const { result } = renderHook(() => useCatalogPoiDetails("北京", "中国", "attraction"));
    expect(result.current.map((d) => d.value)).toEqual(getAttractionDetails("北京").map((d) => d.value));
  });

  it("quote totals unchanged with catalog geo hooks (flag=0)", () => {
    const form = defaultForm(2);
    form.country = "中国";
    form.dayPlans[0] = {
      city: "北京",
      attractions: ["故宫"],
      food: ["全聚德烤鸭"],
      hotel: "tier_comfort",
      cityTransport: "sedan",
    };
    form.dayPlans[1] = {
      city: "上海",
      attractions: [],
      food: [],
      hotel: "",
      transport: "rail",
    };
    const { result } = renderHook(() => useQuoteCalculation(form));
    expect(result.current.budgetBreakdown.total).toBeGreaterThan(0);
    expect(typeof result.current.suggestedTransportFee).toBe("number");
  });
});
