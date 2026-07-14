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

  it("corrects stale NEXT_PUBLIC_API_BASE_URL pointing at Next dev port", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://127.0.0.1:3012");
    vi.resetModules();
    const { apiUrl, routes } = await import("./api");
    expect(apiUrl(routes.auth.seedTestAccounts)).toBe(
      "http://localhost:8080/auth/seed-test-accounts",
    );
  });

  it("staging same-origin proxy: auth direct to API base, JSON via web origin", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://tt-api-staging.fly.dev");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tt-web-staging.fly.dev");
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, origin: "https://tt-web-staging.fly.dev", protocol: "https:", hostname: "tt-web-staging.fly.dev", port: "" },
    });
    vi.resetModules();
    const { apiUrl, routes } = await import("./api");
    expect(apiUrl(routes.auth.login)).toBe("https://tt-api-staging.fly.dev/auth/login");
    expect(apiUrl(routes.guides)).toBe("https://tt-web-staging.fly.dev/api/v1/guides");
  });
});
