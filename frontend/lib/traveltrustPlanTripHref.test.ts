import { describe, expect, it } from "vitest";
import {
  TRAVELTRUST_V6_IN_PAGE_PLAN_HREF,
  isTraveltrustInPagePlanHref,
  resolveTraveltrustPlanTripHref,
  resolveTraveltrustRoleEnterHref,
} from "./traveltrustPlanTripHref";

describe("resolveTraveltrustPlanTripHref", () => {
  it("maps empty and / to in-page start", () => {
    expect(resolveTraveltrustPlanTripHref(undefined)).toBe(TRAVELTRUST_V6_IN_PAGE_PLAN_HREF);
    expect(resolveTraveltrustPlanTripHref("/")).toBe(TRAVELTRUST_V6_IN_PAGE_PLAN_HREF);
  });

  it("keeps explicit anchors and external paths", () => {
    expect(resolveTraveltrustPlanTripHref("#roles")).toBe("#roles");
    expect(resolveTraveltrustPlanTripHref("/governance")).toBe("/governance");
  });

  it("recognizes in-page plan anchors", () => {
    expect(isTraveltrustInPagePlanHref("#start")).toBe(true);
    expect(isTraveltrustInPagePlanHref("/")).toBe(false);
  });

  it("maps traveler enter href to in-page start", () => {
    expect(resolveTraveltrustRoleEnterHref("/")).toBe("#start");
    expect(resolveTraveltrustRoleEnterHref("/guide")).toBe("/guide");
  });
});
