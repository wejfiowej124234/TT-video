import { describe, expect, it } from "vitest";
import { TRAVELTRUST_HERO_P3_CORE_LABEL_NODE_IDS } from "./traveltrustHeroP3DecorNodes";
import { TRAVELTRUST_HERO_L5_MAX_VISIBLE_LABELS } from "./traveltrustHeroL5FinalPolish";
import { pickHeroL5VisibleLabelIds } from "./traveltrustHeroL5LabelPick";

describe("pickHeroL5VisibleLabelIds", () => {
  it("caps visible core labels at four", () => {
    const picked = pickHeroL5VisibleLabelIds(TRAVELTRUST_HERO_P3_CORE_LABEL_NODE_IDS, {
      focusedRegionId: null,
      activeCorridorId: "any",
      focusId: null,
    });
    expect(picked.size).toBe(TRAVELTRUST_HERO_L5_MAX_VISIBLE_LABELS);
  });

  it("always includes focused hub when among candidates", () => {
    const picked = pickHeroL5VisibleLabelIds(TRAVELTRUST_HERO_P3_CORE_LABEL_NODE_IDS, {
      focusedRegionId: "cn",
      activeCorridorId: "asia",
      focusId: "cn",
    });
    expect(picked.has("cn")).toBe(true);
    expect(picked.size).toBeLessThanOrEqual(4);
  });

  it("prefers asia corridor when cn focused", () => {
    const picked = pickHeroL5VisibleLabelIds(TRAVELTRUST_HERO_P3_CORE_LABEL_NODE_IDS, {
      focusedRegionId: "cn",
      activeCorridorId: "asia",
      focusId: "cn",
    });
    expect(picked.has("jp") || picked.has("sg") || picked.has("th")).toBe(true);
  });
});
