import { afterEach, describe, expect, it, vi } from "vitest";
import { TRAVELTRUST_ROLES } from "@/app/traveltrust/traveltrustIdentityModel";
import { TRAVELTRUST_PAGE_BRIEF_DEV_FALLBACK } from "@/lib/traveltrustPageBrief";
import {
  readTraveltrustTheaterMediaMode,
  resolveAllRoleMediaUrls,
  resolveRoleMediaUrls,
  uniqueRoleVideoPrefetchEntries,
} from "./traveltrustMediaFromBrief";

describe("traveltrustMediaFromBrief role env keys", () => {
  it("maps five roles to page-brief role_video_env_keys by index", () => {
    const keys = TRAVELTRUST_PAGE_BRIEF_DEV_FALLBACK.media.role_video_env_keys;
    expect(keys).toHaveLength(5);
    for (const role of TRAVELTRUST_ROLES) {
      const resolved = resolveRoleMediaUrls(role, TRAVELTRUST_PAGE_BRIEF_DEV_FALLBACK);
      expect(resolved.mp4EnvKey).toBeTruthy();
      const idx = keys.indexOf(resolved.mp4EnvKey!);
      expect(idx).toBeGreaterThanOrEqual(0);
    }
    expect(resolveRoleMediaUrls(TRAVELTRUST_ROLES[2]!, TRAVELTRUST_PAGE_BRIEF_DEV_FALLBACK).mp4EnvKey).toBe(
      "NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_MERCHANT",
    );
    expect(resolveRoleMediaUrls(TRAVELTRUST_ROLES[3]!, TRAVELTRUST_PAGE_BRIEF_DEV_FALLBACK).mp4EnvKey).toBe(
      "NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_ACQUISITION",
    );
  });

  it("keeps distinct default mp4 per role and dedupes prefetch by href", () => {
    const roles = resolveAllRoleMediaUrls(TRAVELTRUST_PAGE_BRIEF_DEV_FALLBACK);
    const merchant = roles.find((r) => r.roleId === "merchant");
    const acquisition = roles.find((r) => r.roleId === "acquisition");
    expect(merchant?.mp4).toBe("/media/traveltrust/roles/merchant.mp4");
    expect(acquisition?.mp4).toBe("/media/traveltrust/roles/acquisition.mp4");
    expect(acquisition?.mp4).not.toBe(merchant?.mp4);
    const prefetch = uniqueRoleVideoPrefetchEntries(roles);
    const mp4s = prefetch.map((r) => r.mp4);
    expect(new Set(mp4s).size).toBe(mp4s.length);
    expect(prefetch.length).toBe(roles.length);
    expect(prefetch.every((r) => r.roleId)).toBe(true);
  });
});

describe("traveltrust theater media mode (② tier1-playback)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to tier1-placeholder without env", () => {
    expect(readTraveltrustTheaterMediaMode()).toBe("default");
    const traveler = resolveRoleMediaUrls(TRAVELTRUST_ROLES[0]!, TRAVELTRUST_PAGE_BRIEF_DEV_FALLBACK);
    expect(traveler.tier).toBe("tier1-placeholder");
  });

  it("tier1-playback promotes tier to production for default mp4 paths", () => {
    vi.stubEnv("NEXT_PUBLIC_TRAVELTRUST_THEATER_MEDIA_MODE", "tier1-playback");
    expect(readTraveltrustTheaterMediaMode()).toBe("tier1-playback");
    const traveler = resolveRoleMediaUrls(TRAVELTRUST_ROLES[0]!, TRAVELTRUST_PAGE_BRIEF_DEV_FALLBACK);
    expect(traveler.tier).toBe("production");
    expect(traveler.mp4).toContain("traveler.mp4");
  });
});
