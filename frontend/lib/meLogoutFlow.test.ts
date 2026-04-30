import { describe, expect, it } from "vitest";
import { postLogoutReturnPathForLoginFromParts } from "./meLogoutFlow";

describe("postLogoutReturnPathForLoginFromParts", () => {
  it("keeps path and query for orders", () => {
    expect(postLogoutReturnPathForLoginFromParts("/orders", "?state=open")).toBe("/orders?state=open");
  });

  it("falls back to / when on auth routes", () => {
    expect(postLogoutReturnPathForLoginFromParts("/auth/login", "")).toBe("/");
    expect(postLogoutReturnPathForLoginFromParts("/auth/register", "?returnUrl=%2Fmarket")).toBe("/");
  });

  it("normalizes root", () => {
    expect(postLogoutReturnPathForLoginFromParts("/", "")).toBe("/");
  });
});
