import { afterEach, describe, expect, it, vi } from "vitest";
import {
  TRAVELTRUST_OFFICIAL_SOCIAL_PLATFORMS,
  listTraveltrustOfficialSocialLinksActive,
  listTraveltrustOfficialSocialSlots,
} from "./traveltrustOfficialSocialLinks";

describe("traveltrustOfficialSocialLinks", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("always exposes twelve platform slots for footer UI (reference row)", () => {
    const slots = listTraveltrustOfficialSocialSlots();
    expect(slots.map((s) => s.platform)).toEqual(
      TRAVELTRUST_OFFICIAL_SOCIAL_PLATFORMS.map((p) => p.platform),
    );
    expect(slots).toHaveLength(12);
    expect(slots.every((s) => s.href == null)).toBe(true);
    expect(slots.every((s) => s.envKey.startsWith("NEXT_PUBLIC_TRAVELTRUST_SOCIAL_"))).toBe(true);
  });

  it("activates only platforms with valid https env URLs", () => {
    vi.stubEnv("NEXT_PUBLIC_TRAVELTRUST_SOCIAL_X_URL", "https://x.com/traveltrust");
    vi.stubEnv("NEXT_PUBLIC_TRAVELTRUST_SOCIAL_GITHUB_URL", "http://github.com/bad");
    const slots = listTraveltrustOfficialSocialSlots();
    expect(slots.find((s) => s.platform === "x")?.href).toBe("https://x.com/traveltrust");
    expect(slots.find((s) => s.platform === "github")?.href).toBeNull();
    expect(listTraveltrustOfficialSocialLinksActive()).toHaveLength(1);
  });
});
