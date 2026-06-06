/**
 * 51-T3：社区角色映射与角色胶囊样式（`mapApiUserRoleToCommunity` / `communityStoredRolePillClassName`）
 */
import { describe, expect, it } from "vitest";
import { communityStoredRolePillClassName, mapApiUserRoleToCommunity } from "./communityFeedMappers";

describe("mapApiUserRoleToCommunity", () => {
  it("maps guide (case-insensitive)", () => {
    expect(mapApiUserRoleToCommunity("guide")).toBe("guide");
    expect(mapApiUserRoleToCommunity("Guide")).toBe("guide");
  });
  it("passes through known users.role values lowercased (700)", () => {
    expect(mapApiUserRoleToCommunity("tourist")).toBe("tourist");
    expect(mapApiUserRoleToCommunity("Traveler")).toBe("traveler");
    expect(mapApiUserRoleToCommunity("provider")).toBe("provider");
    expect(mapApiUserRoleToCommunity("REGION_STEWARD")).toBe("region_steward");
    expect(mapApiUserRoleToCommunity("arbitrator")).toBe("arbitrator");
    expect(mapApiUserRoleToCommunity("super_admin")).toBe("super_admin");
  });
  it("maps unknown roles to tourist", () => {
    expect(mapApiUserRoleToCommunity("unknown_role")).toBe("tourist");
    expect(mapApiUserRoleToCommunity(null)).toBe("tourist");
    expect(mapApiUserRoleToCommunity(undefined)).toBe("tourist");
  });
});

describe("communityStoredRolePillClassName (701)", () => {
  it("returns distinct tones per normalized role", () => {
    expect(communityStoredRolePillClassName("guide")).toContain("ref-sun");
    expect(communityStoredRolePillClassName("provider")).toContain("amber");
    expect(communityStoredRolePillClassName("region_steward")).toContain("violet");
    expect(communityStoredRolePillClassName("arbitrator")).toContain("slate");
    expect(communityStoredRolePillClassName("admin")).toContain("orange");
    expect(communityStoredRolePillClassName("super_admin")).toContain("rose");
    expect(communityStoredRolePillClassName("traveler")).toContain("ref-sun");
    expect(communityStoredRolePillClassName("tourist")).toContain("ref-sun");
    expect(communityStoredRolePillClassName("unknown_fallback")).toContain("ref-sun");
  });
});
