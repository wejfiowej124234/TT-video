import { describe, expect, it } from "vitest";
import { CITY_TRANSPORT_DETAILS } from "@/components/market/CustomItineraryModal/constants";
import { BANNED_STOCK_IMAGE_FRAGMENTS, ITINERARY_STOCK } from "./itineraryStockImages";
import { POI_STOCK } from "./poiStockPool";
import { getAttractionDetails } from "./attractions";
import { getFoodDetails } from "./food";

function allImageUrls(): string[] {
  return [
    ...Object.values(ITINERARY_STOCK),
    ...Object.values(POI_STOCK),
    ...Object.values(CITY_TRANSPORT_DETAILS).map((d) => d.image),
  ];
}

describe("itineraryStockImages", () => {
  it("北京景区配图不含禁用图", () => {
    const beijing = getAttractionDetails("北京");
    const forbidden = beijing.find((a) => a.value === "故宫");
    const wall = beijing.find((a) => a.value === "长城");
    expect(forbidden?.image).toContain("1656171600501");
    expect(wall?.image).toContain("1559827260");
    for (const a of beijing) {
      for (const banned of BANNED_STOCK_IMAGE_FRAGMENTS) {
        expect(a.image).not.toContain(banned);
      }
    }
  });

  it("北京美食配图与描述已去模板化", () => {
    const foods = getFoodDetails("北京");
    const duck = foods.find((f) => f.value === "全聚德烤鸭");
    expect(duck?.image).toContain("1765441012353");
    expect(duck?.description).not.toContain("当地特色美食，推荐品尝");
    for (const f of foods) {
      for (const banned of BANNED_STOCK_IMAGE_FRAGMENTS) {
        expect(f.image).not.toContain(banned);
      }
    }
  });

  it("商务车使用 MPV 配图而非皮卡", () => {
    expect(CITY_TRANSPORT_DETAILS.van.image).toContain("1617814076367");
    expect(CITY_TRANSPORT_DETAILS.van.image).not.toContain("1533473359331");
  });

  it("全库配图 URL 不含已知错误 ID", () => {
    for (const url of allImageUrls()) {
      for (const banned of BANNED_STOCK_IMAGE_FRAGMENTS) {
        expect(url, url).not.toContain(banned);
      }
    }
  });
});
