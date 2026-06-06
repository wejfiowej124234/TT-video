import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  applyAdminSessionExpiredClientReset,
  adminApiEnvelopeCode,
  isAdminCapabilitiesSessionExpired,
  maybeApplyAdminSessionExpiredFromAdminFetch,
  resetAdminSessionExpiredClientForTests,
} from "./adminSessionExpiredClient";
import { ADMIN_CONSOLE_ACCESS_COOKIE } from "./adminConsoleAccessCookie";
import { AUTH_SESSION_OK_COOKIE, AUTH_SESSION_TOKEN_KEY, AUTH_USER_ID_KEY } from "@/lib/apiClient/core/authSession";

describe("isAdminCapabilitiesSessionExpired", () => {
  it("detects 401 and login_required codes", () => {
    expect(isAdminCapabilitiesSessionExpired(401, null)).toBe(true);
    expect(isAdminCapabilitiesSessionExpired(403, "login_required")).toBe(true);
    expect(isAdminCapabilitiesSessionExpired(500, "http_401")).toBe(true);
    expect(isAdminCapabilitiesSessionExpired(403, "forbidden")).toBe(false);
  });
});

describe("adminApiEnvelopeCode", () => {
  it("reads error and code fields", () => {
    expect(adminApiEnvelopeCode({ error: "login_required" })).toBe("login_required");
    expect(adminApiEnvelopeCode({ code: "forbidden" })).toBe("forbidden");
  });
});

describe("maybeApplyAdminSessionExpiredFromAdminFetch", () => {
  beforeEach(() => {
    resetAdminSessionExpiredClientForTests();
    vi.stubGlobal("location", { ...window.location, assign: vi.fn() });
  });

  it("redirects on admin 401 envelope", () => {
    const res = { status: 401 } as Response;
    expect(maybeApplyAdminSessionExpiredFromAdminFetch(res, { error: "unauthorized" })).toBe(true);
    expect(window.location.assign).toHaveBeenCalled();
  });
});

describe("applyAdminSessionExpiredClientReset", () => {
  beforeEach(() => {
    resetAdminSessionExpiredClientForTests();
    localStorage.clear();
    document.cookie = `${AUTH_USER_ID_KEY}=abc; Path=/`;
    document.cookie = `${AUTH_SESSION_OK_COOKIE}=1; Path=/`;
    document.cookie = `${ADMIN_CONSOLE_ACCESS_COOKIE}=granted; Path=/`;
    localStorage.setItem(AUTH_USER_ID_KEY, "abc");
    localStorage.setItem(AUTH_SESSION_TOKEN_KEY, "tts_old");
    vi.stubGlobal("location", { ...window.location, assign: vi.fn() });
  });

  it("clears storage, cookies, and redirects to login", () => {
    applyAdminSessionExpiredClientReset();
    expect(localStorage.getItem(AUTH_USER_ID_KEY)).toBeNull();
    expect(localStorage.getItem(AUTH_SESSION_TOKEN_KEY)).toBeNull();
    expect(document.cookie).not.toContain(`${AUTH_USER_ID_KEY}=abc`);
    expect(document.cookie).not.toContain(`${AUTH_SESSION_OK_COOKIE}=1`);
    expect(document.cookie).not.toContain(`${ADMIN_CONSOLE_ACCESS_COOKIE}=granted`);
    expect(window.location.assign).toHaveBeenCalledWith(expect.stringContaining("/auth/login?returnUrl="));
  });
});
