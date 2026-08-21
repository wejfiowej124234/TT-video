import { describe, expect, it } from "vitest";
import {
  TRAVELTRUST_HERO_P3_CORE_LABEL_COUNT,
  TRAVELTRUST_HERO_P3_DECOR_NODE_COUNT,
  isHeroP3CoreLabelNode,
} from "./traveltrustHeroP3DecorNodes";

describe("traveltrustHeroP3DecorNodes", () => {
  it("keeps 24 decor nodes and 10 Phase1 core labels", () => {
    expect(TRAVELTRUST_HERO_P3_DECOR_NODE_COUNT).toBe(24);
    expect(TRAVELTRUST_HERO_P3_CORE_LABEL_COUNT).toBe(10);
  });

  it("isHeroP3CoreLabelNode gates label ids", () => {
    expect(isHeroP3CoreLabelNode("cn")).toBe(true);
    expect(isHeroP3CoreLabelNode("kr")).toBe(true);
    expect(isHeroP3CoreLabelNode("in")).toBe(false);
  });
});
