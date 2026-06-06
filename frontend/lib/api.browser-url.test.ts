/**
 * `apiUrl`：loopback 下浏览器 `/auth/*` 直连 BASE；`/api/*` 等同源 rewrites；其余路径走当前 origin。
 */
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";

describe("apiUrl (browser, loopback base)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("directs /auth to BASE; /api and /meta use same-origin when applicable", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost:8080");
    vi.resetModules();
    const { apiUrl, routes } = await import("./api");
    const o = window.location.origin;
    expect(apiUrl(routes.meta)).toBe(`${o}/meta`);
    expect(apiUrl(routes.metaBuild)).toBe(`${o}/meta/build`);
    expect(apiUrl(routes.guides)).toBe(`${o}/api/v1/guides`);
    expect(apiUrl(routes.auth.login)).toBe("http://localhost:8080/auth/login");
  });
});
