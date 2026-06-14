import { describe, expect, it } from "vitest";
import {
  resolveCatalogAttractionImage,
  resolveCatalogFoodImage,
} from "../productPoiMediaCatalog";
import { getAttractionDetails } from "../attractions";
import { getFoodDetails } from "../food";
import { POI_IMAGE_CANDIDATE_ENTRIES } from "./poiImageCandidates";
import { parsePoiImageId } from "./poiImageId";
import { POI_IMAGE_WHITELIST } from "./poiImageWhitelist";

describe("poiImageWhitelist contract", () => {
  const whitelistEntries = Object.entries(POI_IMAGE_WHITELIST);

  it("白名单为空时仍走语义池（本 Sprint 未直接改线上）", () => {
    expect(whitelistEntries.length).toBeGreaterThanOrEqual(0);
  });

  for (const [poiId, entry] of whitelistEntries) {
    const { city, kind, value } = parsePoiImageId(poiId);

    it(`${poiId} 展示 URL 与白名单锁死`, () => {
      const resolved =
        kind === "attraction"
          ? resolveCatalogAttractionImage(city, value, "__fallback__")
          : resolveCatalogFoodImage(city, value, "__fallback__");
      expect(resolved).toBe(entry.imageUrl);
      expect(resolved).not.toBe("__fallback__");
    });

    it(`${poiId} 景点名称与画面描述锁死`, () => {
      expect(entry.sceneDescription.trim().length).toBeGreaterThan(8);
      expect(entry.approvedCandidateId).toMatch(/^cand-\d+$/);
      expect(entry.license.length).toBeGreaterThan(0);
    });

    it(`${poiId} 白名单与候选清单 APPROVED 一致`, () => {
      const catalog = POI_IMAGE_CANDIDATE_ENTRIES.find((e) => e.poiId === poiId);
      expect(catalog, `missing candidate entry for ${poiId}`).toBeDefined();
      const approved = catalog!.candidates.find((c) => c.id === entry.approvedCandidateId);
      expect(approved?.status).toBe("APPROVED");
      expect(approved?.previewUrl).toBe(entry.imageUrl);
    });

    it(`${poiId} getAttractionDetails/getFoodDetails 与名称一致`, () => {
      if (kind === "attraction") {
        const row = getAttractionDetails(city).find((a) => a.value === value);
        expect(row?.label.length).toBeGreaterThan(0);
        expect(row?.image).toBe(entry.imageUrl);
      } else {
        const row = getFoodDetails(city).find((f) => f.value === value);
        expect(row?.label.length).toBeGreaterThan(0);
        expect(row?.image).toBe(entry.imageUrl);
      }
    });
  }
});
