import { describe, expect, it } from "vitest";
import { TRAVELTRUST_ROLES } from "@/app/traveltrust/traveltrustIdentityModel";
import { TT_THEATER_ROLE_ORDER, TT_THEATER_ROLE_ZH } from "./traveltrustProductRoleGlossary";
import zh from "@/locales/zh";

describe("traveltrustProductRoleGlossary", () => {
  it("lists five theater roles in product order", () => {
    expect(TRAVELTRUST_ROLES.map((r) => r.id)).toEqual([...TT_THEATER_ROLE_ORDER]);
    expect(TT_THEATER_ROLE_ORDER).toHaveLength(5);
  });

  it("matches traveltrust theater i18n keys (87 §1.6)", () => {
    const nameKeys: Record<(typeof TRAVELTRUST_ROLES)[number]["id"], keyof typeof zh> = {
      traveler: "traveltrust_role_traveler_name",
      guide: "traveltrust_role_guide_name",
      merchant: "traveltrust_role_merchant_name",
      acquisition: "traveltrust_role_acquisition_name",
      region_steward: "traveltrust_role_steward_name",
    };
    for (const role of TRAVELTRUST_ROLES) {
      expect(zh[nameKeys[role.id]]).toBe(TT_THEATER_ROLE_ZH[role.id]);
    }
  });

  it("does not expose deprecated provider theater tab id", () => {
    expect(TRAVELTRUST_ROLES.map((r) => r.id)).not.toContain("provider");
  });
});
