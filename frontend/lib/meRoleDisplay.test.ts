import { describe, it, expect } from "vitest";
import {
  communityRoleLabelI18nKey,
  communityAuthorIdentityI18nKeys,
  communityAuthorIdentityForComment,
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

describe("communityAuthorIdentityI18nKeys", () => {
  it("uses tourist when no role", () => {
    expect(communityAuthorIdentityI18nKeys({})).toEqual(["community_role_tourist"]);
    expect(communityAuthorIdentityI18nKeys(null)).toEqual(["community_role_tourist"]);
  });
  it("maps provider / region_steward / guide", () => {
    expect(communityAuthorIdentityI18nKeys({ role: "provider" })).toEqual(["community_role_provider"]);
    expect(communityAuthorIdentityI18nKeys({ role: "region_steward" })).toEqual([
      "community_role_region_steward",
    ]);
    expect(communityAuthorIdentityI18nKeys({ role: "guide" })).toEqual(["community_role_guide"]);
  });
  it("picks admin over guide when both identities exist", () => {
    expect(communityAuthorIdentityI18nKeys({ role: "admin", isEscrowGuide: true })).toEqual([
      "community_role_admin",
    ]);
    expect(communityAuthorIdentityI18nKeys({ isEscrowGuide: true })).toEqual(["community_role_guide"]);
  });
  it("ranks steward above merchant and merchant above guide", () => {
    expect(communityAuthorIdentityI18nKeys({ role: "region_steward", isEscrowGuide: true })).toEqual([
      "community_role_region_steward",
    ]);
    expect(communityAuthorIdentityI18nKeys({ role: "provider", isEscrowGuide: true })).toEqual([
      "community_role_provider",
    ]);
  });
});

describe("communityAuthorIdentityForComment", () => {
  it("uses post author rank when the commenter is the post author", () => {
    const commentAuthor = { id: "u1", role: "guide", isEscrowGuide: true };
    const postAuthor = { id: "u1", role: "admin", isEscrowGuide: true };
    expect(communityAuthorIdentityI18nKeys(communityAuthorIdentityForComment(commentAuthor, postAuthor))).toEqual([
      "community_role_admin",
    ]);
  });
  it("does not borrow another user's identity", () => {
    const commentAuthor = { id: "u2", role: "guide" };
    const postAuthor = { id: "u1", role: "admin", isEscrowGuide: true };
    expect(communityAuthorIdentityI18nKeys(communityAuthorIdentityForComment(commentAuthor, postAuthor))).toEqual([
      "community_role_guide",
    ]);
  });
});
