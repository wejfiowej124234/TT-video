import { describe, expect, it } from "vitest";
import { collectAllProductPoiImageUrls } from "./productPoiMediaCatalog";
import { ITINERARY_STOCK } from "./itineraryStockImages";
import { POI_STOCK } from "./poiStockPool";

const RUN_HEALTH = process.env.RUN_IMAGE_HEALTH === "1";

async function assertUrlOk(url: string): Promise<void> {
  const res = await fetch(url, { method: "GET", redirect: "follow" });
  expect(res.ok, `${url} → ${res.status}`).toBe(true);
}

describe.skipIf(!RUN_HEALTH)("itinerary image URL health (RUN_IMAGE_HEALTH=1)", () => {
  it(
    "POI 配图池全部 HTTP 200",
    async () => {
      const urls = [
        ...new Set([
          ...Object.values(POI_STOCK),
          ...Object.values(ITINERARY_STOCK),
          ...collectAllProductPoiImageUrls(),
        ]),
      ];
      for (const url of urls) {
        await assertUrlOk(url);
      }
    },
    120_000
  );
});

describe("itinerary image health (offline)", () => {
  it("配图池 URL 格式合法", () => {
    const urls = [...Object.values(POI_STOCK), ...Object.values(ITINERARY_STOCK)];
    for (const url of urls) {
      expect(url).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
    }
  });
});
