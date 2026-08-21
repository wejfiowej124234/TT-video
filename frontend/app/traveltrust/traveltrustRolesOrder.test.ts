import { describe, expect, it } from "vitest";
import { TRAVELTRUST_ROLES } from "./traveltrustIdentityModel";
import { TRAVELTRUST_PAGE_BRIEF_DEV_FALLBACK } from "@/lib/traveltrustPageBrief";
import { TT_THEATER_ROLE_ORDER } from "@/lib/traveltrustProductRoleGlossary";

/** 85 v6 叙事顺序（87 §1.6 · ①） */
describe("traveltrustRolesOrder", () => {
  it("exposes five product theater roles", () => {
    expect(TRAVELTRUST_ROLES).toHaveLength(5);
    expect(TRAVELTRUST_ROLES.map((r) => r.id)).toEqual([...TT_THEATER_ROLE_ORDER]);
  });

  it("maps brief role_video_env_keys index 0..4 to theater order", () => {
    const keys = TRAVELTRUST_PAGE_BRIEF_DEV_FALLBACK.media.role_video_env_keys;
    expect(keys).toHaveLength(5);
    expect(keys[0]).toContain("TRAVELER");
    expect(keys[1]).toContain("GUIDE");
    expect(keys[2]).toMatch(/MERCHANT|PROVIDER/);
    expect(keys[3]).toContain("ACQUISITION");
    expect(keys[4]).toContain("REGION_STEWARD");
  });
});
