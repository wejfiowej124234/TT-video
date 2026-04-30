import { describe, it, expect, vi, afterEach } from "vitest";
import {
  isCommunityMeAvatarUploadEnabled,
  isCommunityMeBioEnabled,
  isCommunityMeLikesListEnabled,
} from "./communityMeFeatureFlags";

describe("communityMeFeatureFlags", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("likes defaults on when env unset; bio stays off", () => {
    vi.stubEnv("NEXT_PUBLIC_COMMUNITY_ME_LIKES_LIST", "");
    vi.stubEnv("NEXT_PUBLIC_COMMUNITY_ME_BIO", "");
    expect(isCommunityMeLikesListEnabled()).toBe(true);
    expect(isCommunityMeBioEnabled()).toBe(false);
  });

  it("likes explicit off when env is 0", () => {
    vi.stubEnv("NEXT_PUBLIC_COMMUNITY_ME_LIKES_LIST", "0");
    expect(isCommunityMeLikesListEnabled()).toBe(false);
  });

  it("avatar upload follows NODE_ENV when env unset", () => {
    vi.stubEnv("NEXT_PUBLIC_COMMUNITY_ME_AVATAR_UPLOAD", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(isCommunityMeAvatarUploadEnabled()).toBe(false);
    vi.stubEnv("NODE_ENV", "development");
    expect(isCommunityMeAvatarUploadEnabled()).toBe(true);
  });

  it("accepts 1/true/yes/on (case-insensitive)", () => {
    vi.stubEnv("NEXT_PUBLIC_COMMUNITY_ME_LIKES_LIST", "TRUE");
    vi.stubEnv("NEXT_PUBLIC_COMMUNITY_ME_AVATAR_UPLOAD", "On");
    vi.stubEnv("NODE_ENV", "production");
    expect(isCommunityMeLikesListEnabled()).toBe(true);
    expect(isCommunityMeAvatarUploadEnabled()).toBe(true);
  });

  it("bio in production requires NEXT_PUBLIC_COMMUNITY_ME_BIO_ALLOW_PRODUCTION", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_COMMUNITY_ME_BIO", "1");
    vi.stubEnv("NEXT_PUBLIC_COMMUNITY_ME_BIO_ALLOW_PRODUCTION", "");
    expect(isCommunityMeBioEnabled()).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_COMMUNITY_ME_BIO_ALLOW_PRODUCTION", "1");
    expect(isCommunityMeBioEnabled()).toBe(true);
  });

  it("bio in development does not require allow-production flag", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_COMMUNITY_ME_BIO", "1");
    vi.stubEnv("NEXT_PUBLIC_COMMUNITY_ME_BIO_ALLOW_PRODUCTION", "");
    expect(isCommunityMeBioEnabled()).toBe(true);
  });

  it("avatar explicit off wins in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_COMMUNITY_ME_AVATAR_UPLOAD", "0");
    expect(isCommunityMeAvatarUploadEnabled()).toBe(false);
  });
});
