/**
 * `apiUrl` 在浏览器 + loopback API 基址下返回相对路径（Next rewrites 代理）。
 */
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";

describe("apiUrl (browser, loopback base)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns current origin + path when NEXT_PUBLIC_API_BASE_URL is localhost (browser)", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost:8080");
    vi.resetModules();
    const { apiUrl, routes } = await import("./api");
    const o = window.location.origin;
    expect(apiUrl(routes.meta)).toBe(`${o}/meta`);
    expect(apiUrl(routes.guides)).toBe(`${o}/api/v1/guides`);
  });
});
