import { afterEach, describe, expect, it, vi } from "vitest";
import {
  feedbackMediaEmbeddedPolicyViolationCode,
  feedbackMediaItemHasAllowedClientScheme,
  isAllowedCommunityEmbeddedHttpOrHttpsUrl,
  isAllowedCommunityVideoCoverUrl,
  parseCommaSeparatedUrlPrefixes,
} from "./communityPostMediaEmbeddedUrlPolicy";

describe("communityPostMediaEmbeddedUrlPolicy", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("parseCommaSeparatedUrlPrefixes trims and drops empties", () => {
    expect(parseCommaSeparatedUrlPrefixes(" https://a/x , ,https://b/ ")).toEqual(["https://a/x", "https://b/"]);
  });

  it("allows any https when no public prefix env and production safe off", () => {
    vi.stubEnv("NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES", "");
    vi.stubEnv("NEXT_PUBLIC_TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS", "");
    expect(isAllowedCommunityEmbeddedHttpOrHttpsUrl("https://evil.example/x.png")).toBe(true);
  });

  it("rejects http when NEXT_PUBLIC_TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS truthy", () => {
    vi.stubEnv("NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES", "");
    vi.stubEnv("NEXT_PUBLIC_TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS", "1");
    expect(isAllowedCommunityEmbeddedHttpOrHttpsUrl("http://cdn.example/x.png")).toBe(false);
  });

  it("requires prefix when NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES non-empty", () => {
    vi.stubEnv("NEXT_PUBLIC_TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS", "");
    vi.stubEnv(
      "NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES",
      "https://cdn.example.com,https://api.example.com",
    );
    expect(isAllowedCommunityEmbeddedHttpOrHttpsUrl("https://evil.example/x.png")).toBe(false);
    expect(isAllowedCommunityEmbeddedHttpOrHttpsUrl("https://cdn.example.com/x.png")).toBe(true);
  });

  it("isAllowedCommunityVideoCoverUrl accepts on-site path and applies http(s) rules", () => {
    vi.stubEnv("NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES", "");
    vi.stubEnv("NEXT_PUBLIC_TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS", "1");
    expect(isAllowedCommunityVideoCoverUrl("/api/v1/uploads/community-posts/u.jpg")).toBe(true);
    expect(isAllowedCommunityVideoCoverUrl("https://x/cover.jpg")).toBe(true);
    expect(isAllowedCommunityVideoCoverUrl("http://x/cover.jpg")).toBe(false);
  });

  it("feedbackMediaEmbeddedPolicyViolationCode skips data: and flags http under production safe", () => {
    vi.stubEnv("NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES", "");
    vi.stubEnv("NEXT_PUBLIC_TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS", "1");
    expect(feedbackMediaEmbeddedPolicyViolationCode(["data:image/jpeg;base64,xx"])).toBe(null);
    expect(feedbackMediaEmbeddedPolicyViolationCode(["http://x/a.png"])).toBe("media_url_invalid_scheme");
  });

  it("feedbackMediaItemHasAllowedClientScheme mirrors backend ASCII scheme rules", () => {
    expect(feedbackMediaItemHasAllowedClientScheme("HTTPS://a/x")).toBe(true);
    expect(feedbackMediaItemHasAllowedClientScheme("Data:Image/png;base64,x")).toBe(true);
    expect(feedbackMediaItemHasAllowedClientScheme("DATA:VIDEO/mp4;base64,x")).toBe(true);
    expect(feedbackMediaItemHasAllowedClientScheme("ftp://a")).toBe(false);
    expect(feedbackMediaItemHasAllowedClientScheme("data:application/json,x")).toBe(false);
  });

  it("feedbackMediaEmbeddedPolicyViolationCode enforces prefix list", () => {
    vi.stubEnv("NEXT_PUBLIC_TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS", "");
    vi.stubEnv("NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES", "https://cdn.example.com");
    expect(feedbackMediaEmbeddedPolicyViolationCode(["https://evil/x.png"])).toBe("media_url_prefix_not_allowed");
    expect(feedbackMediaEmbeddedPolicyViolationCode(["https://cdn.example.com/x.png"])).toBe(null);
  });
});
