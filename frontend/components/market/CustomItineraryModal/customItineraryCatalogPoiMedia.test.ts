/**
 * Custom Itinerary W5 · POI media catalog UI contract (flag=1 image merge · 报价仍 TS)
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
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
    resolveCatalogPoiDetails: vi.fn(actual.resolveCatalogPoiDetails),
  };
});

import { isCatalogApiEnabled } from "@/lib/catalogApi/client";
import { resolveCatalogPoiDetails } from "@/lib/catalogApi/resolve";
import { useCatalogPoiDetails } from "@/lib/catalogApi/useCatalogPoi";

const TS_BEIJING = getAttractionDetails("北京");
const CATALOG_IMAGE = "https://cdn.example.com/w5/gugong.jpg";

describe("CustomItineraryModal W5 POI media (C-12)", () => {
  beforeEach(() => {
    vi.mocked(isCatalogApiEnabled).mockReturnValue(false);
    vi.mocked(resolveCatalogPoiDetails).mockReset();
  });

  it("flag=0: POI images match TS (default)", () => {
    const { result } = renderHook(() => useCatalogPoiDetails("北京", "中国", "attraction"));
    const gugong = result.current.find((d) => d.value === "故宫");
    expect(gugong?.image).toBe(TS_BEIJING.find((d) => d.value === "故宫")?.image);
  });

  it("flag=1: catalog image shown when resolve returns catalog-api with override", async () => {
    vi.mocked(isCatalogApiEnabled).mockReturnValue(true);
    const upgraded = TS_BEIJING.map((d) =>
      d.value === "故宫" ? { ...d, image: CATALOG_IMAGE } : d,
    );
    vi.mocked(resolveCatalogPoiDetails).mockResolvedValue({
      data: upgraded,
      source: "catalog-api",
    });
    const { result } = renderHook(() => useCatalogPoiDetails("北京", "中国", "attraction"));
    await waitFor(() =>
      expect(result.current.find((d) => d.value === "故宫")?.image).toBe(CATALOG_IMAGE),
    );
  });

  it("flag=1 fallback: empty catalog images keep TS image", async () => {
    vi.mocked(isCatalogApiEnabled).mockReturnValue(true);
    vi.mocked(resolveCatalogPoiDetails).mockResolvedValue({ data: TS_BEIJING, source: "ts" });
    const { result } = renderHook(() => useCatalogPoiDetails("北京", "中国", "attraction"));
    await waitFor(() => expect(resolveCatalogPoiDetails).toHaveBeenCalled());
    expect(result.current.find((d) => d.value === "故宫")?.image).toBe(
      TS_BEIJING.find((d) => d.value === "故宫")?.image,
    );
  });

  it("quote totals unchanged when POI images upgraded (flag=1 mock)", () => {
    const form = defaultForm(2);
    form.country = "中国";
    form.dayPlans[0] = {
      city: "北京",
      attractions: ["故宫"],
      food: [],
      hotel: "tier_comfort",
      cityTransport: "sedan",
    };
    form.dayPlans[1] = { city: "上海", attractions: [], food: [], hotel: "", transport: "rail" };
    const { result } = renderHook(() => useQuoteCalculation(form));
    expect(result.current.budgetBreakdown.total).toBeGreaterThan(0);
  });
});
