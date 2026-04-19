/**
 * `apiUrl`：loopback 下 `/auth/*`、`/api/*` 直连 BASE；其余仍可走当前 origin（如 `/meta` rewrites）。
 */
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";

describe("apiUrl (browser, loopback base)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("directs /auth and /api to BASE; other paths use same-origin when applicable", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost:8080");
    vi.resetModules();
    const { apiUrl, routes } = await import("./api");
    const o = window.location.origin;
    expect(apiUrl(routes.meta)).toBe(`${o}/meta`);
    expect(apiUrl(routes.guides)).toBe("http://localhost:8080/api/v1/guides");
    expect(apiUrl(routes.auth.login)).toBe("http://localhost:8080/auth/login");
  });
});
