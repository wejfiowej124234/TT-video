import { describe, it, expect } from "vitest";
import {
  communityRoleLabelI18nKey,
  communityStoredRoleLabelI18nKey,
  meProtocolRoleForDisplay,
  meRoleLabelI18nKey,
  userIsGuide,
} from "./meRoleDisplay";
import type { UserShape } from "@/components/me/constants";

describe("userIsGuide", () => {
  it("is true when legacy role is guide", () => {
    expect(userIsGuide({ role: "guide" })).toBe(true);
    expect(userIsGuide({ role: "guide", role_traveltrust: "traveler" })).toBe(true);
  });

  it("is true when protocol role_traveltrust is guide", () => {
    expect(userIsGuide({ role: "tourist", role_traveltrust: "guide" })).toBe(true);
    expect(userIsGuide({ role: "tourist", role_traveltrust: " guide " })).toBe(true);
  });

  it("is false for non-guides", () => {
    expect(userIsGuide({ role: "tourist" })).toBe(false);
    expect(userIsGuide({ role: "tourist", role_traveltrust: "traveler" })).toBe(false);
    expect(userIsGuide(null)).toBe(false);
    expect(userIsGuide(undefined)).toBe(false);
  });
});

describe("meProtocolRoleForDisplay", () => {
  it("prefers non-empty role_traveltrust over role", () => {
    const u: UserShape = { role: "tourist", role_traveltrust: "traveler" };
    expect(meProtocolRoleForDisplay(u)).toBe("traveler");
  });
  it("falls back to role when role_traveltrust missing", () => {
    const u: UserShape = { role: "guide" };
    expect(meProtocolRoleForDisplay(u)).toBe("guide");
  });
  it("ignores whitespace-only role_traveltrust", () => {
    const u: UserShape = { role: "tourist", role_traveltrust: "   " };
    expect(meProtocolRoleForDisplay(u)).toBe("tourist");
  });
});

describe("meRoleLabelI18nKey", () => {
  it("maps traveler to me_role_traveler", () => {
    expect(meRoleLabelI18nKey("traveler")).toBe("me_role_traveler");
  });
  it("maps tourist to me_role_tourist", () => {
    expect(meRoleLabelI18nKey("tourist")).toBe("me_role_tourist");
  });
  it("maps unknown to me_role_tourist", () => {
    expect(meRoleLabelI18nKey("")).toBe("me_role_tourist");
    expect(meRoleLabelI18nKey("unknown")).toBe("me_role_tourist");
  });
});

describe("communityStoredRoleLabelI18nKey", () => {
  it("maps stored traveler to community_role_traveler", () => {
    expect(communityStoredRoleLabelI18nKey("traveler")).toBe("community_role_traveler");
    expect(communityStoredRoleLabelI18nKey(" traveler ")).toBe("community_role_traveler");
    expect(communityStoredRoleLabelI18nKey("tourist")).toBe("community_role_tourist");
  });
  it("maps guide and defaults", () => {
    expect(communityStoredRoleLabelI18nKey("guide")).toBe("community_role_guide");
    expect(communityStoredRoleLabelI18nKey("Provider")).toBe("community_role_provider");
    expect(communityStoredRoleLabelI18nKey("REGION_STEWARD")).toBe("community_role_region_steward");
    expect(communityStoredRoleLabelI18nKey("arbitrator")).toBe("community_role_arbitrator");
    expect(communityStoredRoleLabelI18nKey("super_admin")).toBe("community_role_admin");
    expect(communityStoredRoleLabelI18nKey("unknown_x")).toBe("community_role_tourist");
  });
});

describe("communityRoleLabelI18nKey", () => {
  it("maps traveler to community_role_traveler", () => {
    expect(communityRoleLabelI18nKey("traveler")).toBe("community_role_traveler");
  });
  it("maps guide to community_role_guide", () => {
    expect(communityRoleLabelI18nKey("guide")).toBe("community_role_guide");
  });
  it("maps unknown to community_role_tourist", () => {
    expect(communityRoleLabelI18nKey("")).toBe("community_role_tourist");
  });
});
