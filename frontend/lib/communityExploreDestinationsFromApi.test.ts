import { describe, expect, it } from "vitest";
import { exploreRegionBlocksFromApiAggregate } from "./communityExploreDestinationsFromApi";

describe("exploreRegionBlocksFromApiAggregate", () => {
  it("groups API rows by region and sorts by post_count", () => {
    const blocks = exploreRegionBlocksFromApiAggregate([
      { destination: "京都", post_count: 5 },
      { destination: "东京", post_count: 12 },
      { destination: "未知城", post_count: 99 },
    ]);
    const jp = blocks.find((b) => b.regionKey === "jp");
    expect(jp?.destinations[0]).toBe("东京");
    const cn = blocks.find((b) => b.regionKey === "cn");
    // Unmapped destinations must not pollute the China region chip list (HU-008).
    expect(cn?.destinations ?? []).not.toContain("未知城");
  });
});
