import { afterEach, describe, expect, it, vi } from "vitest";
import { devCanonicalSiteOrigin, resolveDevLoopbackOriginRedirect } from "./devLoopbackOrigin";

describe("devLoopbackOrigin", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("redirects localhost to canonical 127.0.0.1 when SITE_URL set", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://127.0.0.1:3012");
    expect(
      resolveDevLoopbackOriginRedirect("http://localhost:3012/traveltrust#roles"),
    ).toBe("http://127.0.0.1:3012/traveltrust#roles");
  });

  it("does not redirect when already on canonical host", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://127.0.0.1:3012");
    expect(resolveDevLoopbackOriginRedirect("http://127.0.0.1:3012/")).toBeNull();
  });

  it("does not redirect in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://127.0.0.1:3012");
    expect(resolveDevLoopbackOriginRedirect("http://localhost:3012/")).toBeNull();
  });

  it("defaults canonical to 127.0.0.1:3012 in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(devCanonicalSiteOrigin()).toBe("http://127.0.0.1:3012");
  });
});
