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

  it("exposes six Owner platforms with default https hrefs", () => {
    const slots = listTraveltrustOfficialSocialSlots();
    expect(slots.map((s) => s.platform)).toEqual([
      "instagram",
      "tiktok",
      "threads",
      "medium",
      "discord",
      "x",
    ]);
    expect(slots).toHaveLength(6);
    expect(TRAVELTRUST_OFFICIAL_SOCIAL_PLATFORMS).toHaveLength(6);
    expect(slots.every((s) => s.href?.startsWith("https://"))).toBe(true);
    expect(listTraveltrustOfficialSocialLinksActive()).toHaveLength(6);
  });

  it("lets env override default href when https", () => {
    vi.stubEnv("NEXT_PUBLIC_TRAVELTRUST_SOCIAL_X_URL", "https://x.com/traveltrust-override");
    vi.stubEnv("NEXT_PUBLIC_TRAVELTRUST_SOCIAL_INSTAGRAM_URL", "http://instagram.com/bad");
    const slots = listTraveltrustOfficialSocialSlots();
    expect(slots.find((s) => s.platform === "x")?.href).toBe("https://x.com/traveltrust-override");
    // invalid env falls back to default
    expect(slots.find((s) => s.platform === "instagram")?.href).toBe(
      "https://www.instagram.com/traveltrust.ir/",
    );
  });
});
