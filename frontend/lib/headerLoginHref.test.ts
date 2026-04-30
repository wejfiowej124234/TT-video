import { describe, expect, it } from "vitest";
import {
  AUTH_LOGIN_RETURN_HOME,
  AUTH_REGISTER_RETURN_HOME,
  buildAuthRegisterRoleHref,
  buildHeaderLoginHref,
  buildHeaderRegisterHref,
} from "./headerLoginHref";

describe("buildHeaderLoginHref", () => {
  it("adds returnUrl with query on normal pages", () => {
    const sp = new URLSearchParams("tab=posts");
    expect(buildHeaderLoginHref("/community/me", sp)).toBe(
      "/auth/login?returnUrl=" + encodeURIComponent("/community/me?tab=posts"),
    );
  });

  it("does not self-reference on /auth/login", () => {
    expect(buildHeaderLoginHref("/auth/login", new URLSearchParams("x=1"))).toBe("/auth/login");
  });

  it("uses pathname only when searchParams omitted", () => {
    expect(buildHeaderLoginHref("/orders", null)).toBe("/auth/login?returnUrl=" + encodeURIComponent("/orders"));
  });

  it("preserves query on root path via B-060 helper", () => {
    expect(buildHeaderLoginHref("/", new URLSearchParams("ref=banner"))).toBe(
      "/auth/login?returnUrl=" + encodeURIComponent("/?ref=banner"),
    );
  });
});

describe("buildHeaderRegisterHref", () => {
  it("adds returnUrl on market path", () => {
    expect(buildHeaderRegisterHref("/market", null)).toBe("/auth/register?returnUrl=" + encodeURIComponent("/market"));
  });

  it("strips nested returnUrl on /auth pages", () => {
    expect(buildHeaderRegisterHref("/auth/login", new URLSearchParams("returnUrl=%2Forders"))).toBe("/auth/register");
  });
});

describe("AUTH_LOGIN_RETURN_HOME", () => {
  it("is a valid login link with home return", () => {
    expect(AUTH_LOGIN_RETURN_HOME).toBe("/auth/login?returnUrl=%2F");
  });
});

describe("AUTH_REGISTER_RETURN_HOME", () => {
  it("is a valid register link with home return", () => {
    expect(AUTH_REGISTER_RETURN_HOME).toBe("/auth/register?returnUrl=%2F");
  });
});

describe("buildAuthRegisterRoleHref", () => {
  it("includes role and returnUrl from pathname", () => {
    expect(buildAuthRegisterRoleHref("/market", "provider")).toBe(
      "/auth/register?role=provider&returnUrl=" + encodeURIComponent("/market"),
    );
  });

  it("uses slash when pathname empty", () => {
    expect(buildAuthRegisterRoleHref(null, "steward")).toContain("role=steward");
    expect(buildAuthRegisterRoleHref(null, "steward")).toContain("returnUrl=%2F");
  });

  it("includes query in returnUrl (B-060)", () => {
    expect(buildAuthRegisterRoleHref("/market", "provider", new URLSearchParams("view=orders"))).toBe(
      "/auth/register?role=provider&returnUrl=" + encodeURIComponent("/market?view=orders"),
    );
  });

  it("omits returnUrl on /auth routes", () => {
    expect(buildAuthRegisterRoleHref("/auth/login", "steward", new URLSearchParams("x=1"))).toBe(
      "/auth/register?role=steward",
    );
  });
});
