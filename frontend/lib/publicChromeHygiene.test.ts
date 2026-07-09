import { afterEach, describe, expect, it, vi } from "vitest";
import {
  allowPublicTestPersonaChrome,
  isDevCatalogEmail,
  isPublicTestPersonaNickname,
  publicChromeDisplayName,
} from "./publicChromeHygiene";

describe("publicChromeHygiene", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("flags seed test emails", () => {
    expect(isDevCatalogEmail("tourist@test.com")).toBe(true);
    expect(isDevCatalogEmail("adm-rbac-1@traveltrust.test")).toBe(true);
    expect(isDevCatalogEmail("real.user@example.com")).toBe(false);
  });

  it("flags test nicknames", () => {
    expect(isPublicTestPersonaNickname("测试游客")).toBe(true);
    expect(isPublicTestPersonaNickname("E2E Narrow")).toBe(true);
    expect(isPublicTestPersonaNickname("杭州向导")).toBe(false);
  });

  it("sanitizes chrome display unless opt-in", () => {
    vi.stubEnv("NEXT_PUBLIC_TRAVELTRUST_ALLOW_TEST_PERSONA_CHROME", "");
    expect(publicChromeDisplayName("测试游客", "tourist@test.com", "用户")).toBe("用户");
    expect(publicChromeDisplayName("Alice", "alice@example.com", "用户")).toBe("Alice");
  });

  it("shows seed persona when ALLOW_TEST_PERSONA_CHROME=1", () => {
    vi.stubEnv("NEXT_PUBLIC_TRAVELTRUST_ALLOW_TEST_PERSONA_CHROME", "1");
    expect(allowPublicTestPersonaChrome()).toBe(true);
    expect(publicChromeDisplayName("测试游客", "tourist@test.com", "用户")).toBe("测试游客");
  });
});
