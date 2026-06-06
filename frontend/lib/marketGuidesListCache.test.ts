import { beforeEach, describe, expect, it } from "vitest";
import {
  buildMarketGuidesListCacheKey,
  invalidateMarketGuidesListCache,
  readMarketGuidesListCache,
  writeMarketGuidesListCache,
} from "./marketGuidesListCache";
import type { GuideCardItem } from "@/lib/marketTypes";

const sampleGuides: GuideCardItem[] = [{ id: "g1", city: "东京" }];

describe("marketGuidesListCache", () => {
  beforeEach(() => {
    invalidateMarketGuidesListCache();
  });

  it("returns cached guides for identical filter key within TTL", () => {
    const filterState = { country: "日本", city: "东京", languages: ["ja"], serviceTypes: ["guide"] };
    const apiParams = { country: "日本", limit: 30 };
    const key = buildMarketGuidesListCacheKey(filterState, apiParams);
    writeMarketGuidesListCache({
      key,
      guides: sampleGuides,
      hasMore: false,
      nextCursor: null,
    });
    const hit = readMarketGuidesListCache(key);
    expect(hit?.guides).toEqual(sampleGuides);
  });

  it("invalidate clears cache", () => {
    const key = buildMarketGuidesListCacheKey(
      { country: "", city: "", languages: [], serviceTypes: [] },
      {},
    );
    writeMarketGuidesListCache({ key, guides: sampleGuides, hasMore: false, nextCursor: null });
    invalidateMarketGuidesListCache();
    expect(readMarketGuidesListCache(key)).toBeNull();
  });
});
