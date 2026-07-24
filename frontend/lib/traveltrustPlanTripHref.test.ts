import { describe, expect, it } from "vitest";
import {
  TRAVELTRUST_V6_PLAN_TRIP_HREF,
  isTraveltrustInPagePlanHref,
  resolveTraveltrustPlanTripHref,
  resolveTraveltrustRoleEnterHref,
} from "./traveltrustPlanTripHref";

describe("resolveTraveltrustPlanTripHref", () => {
  it("maps empty, /, and legacy #start to custom-travel home", () => {
    expect(resolveTraveltrustPlanTripHref(undefined)).toBe(TRAVELTRUST_V6_PLAN_TRIP_HREF);
    expect(resolveTraveltrustPlanTripHref("/")).toBe("/");
    expect(resolveTraveltrustPlanTripHref("#start")).toBe("/");
  });

  it("keeps explicit anchors and external paths", () => {
    expect(resolveTraveltrustPlanTripHref("#roles")).toBe("#roles");
    expect(resolveTraveltrustPlanTripHref("/governance")).toBe("/governance");
  });

  it("recognizes legacy in-page plan anchors only", () => {
    expect(isTraveltrustInPagePlanHref("#start")).toBe(true);
    expect(isTraveltrustInPagePlanHref("/")).toBe(false);
  });

  it("maps traveler enter href to custom-travel home", () => {
    expect(resolveTraveltrustRoleEnterHref("/")).toBe("/");
    expect(resolveTraveltrustRoleEnterHref("#start")).toBe("/");
    expect(resolveTraveltrustRoleEnterHref("/guide")).toBe("/guide");
  });
});
