import { describe, expect, it } from "vitest";
import {
  applyDidRankDevPreviewTravelers,
  buildDidRankDevPreviewTravelers,
} from "./didRankDevPreview";

describe("didRankDevPreview", () => {
  it("builds 22 stable traveler rows with top10 podium ranks", () => {
    const list = buildDidRankDevPreviewTravelers();
    expect(list).toHaveLength(22);
    expect(list[0]?.rank).toBe(1);
    expect(list[9]?.rank).toBe(10);
    expect(list[10]?.rank).toBe(11);
    expect(list[0]?.completed_orders).toBeGreaterThan(list[9]?.completed_orders ?? 0);
  });

  it("replaces API list when fewer than 10 travelers", () => {
    const api = [{ id: "real", rank: 2, nickname: "测试游客", totalSpentUsdt: 0, countriesCount: 0, citiesCount: 0 }];
    const out = applyDidRankDevPreviewTravelers(api);
    expect(out.length).toBe(22);
    expect(out[0]?.nickname).toBe("云游四海");
  });

  it("keeps API list when 10 or more", () => {
    const api = Array.from({ length: 10 }, (_, i) => ({
      id: `u-${i}`,
      rank: i + 1,
      nickname: `U${i}`,
      totalSpentUsdt: 100 - i,
      countriesCount: 1,
      citiesCount: 1,
    }));
    const out = applyDidRankDevPreviewTravelers(api);
    expect(out).toBe(api);
  });
});
