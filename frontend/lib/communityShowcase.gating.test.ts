import { describe, it, expect, vi, afterEach } from "vitest";
import {
  shouldUseCommunityShowcaseOnEmpty,
  shouldUseCommunityShowcaseForRelationalUi,
  isShowcasePostId,
  isShowcaseAuthorId,
  findCommunityShowcasePostById,
} from "./communityShowcase";

describe("communityShowcase · env gating (②③ relational parity)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("relational UI follows same gating as onEmpty", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE", "");
    expect(shouldUseCommunityShowcaseForRelationalUi()).toBe(true);
    expect(shouldUseCommunityShowcaseForRelationalUi()).toBe(shouldUseCommunityShowcaseOnEmpty());
    vi.stubEnv("NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE", "1");
    expect(shouldUseCommunityShowcaseForRelationalUi()).toBe(true);
    vi.stubEnv("NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE", "0");
    expect(shouldUseCommunityShowcaseForRelationalUi()).toBe(false);
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE", "");
    expect(shouldUseCommunityShowcaseForRelationalUi()).toBe(false);
  });

  it("onEmpty follows dev default when SHOWCASE unset", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE", "");
    expect(shouldUseCommunityShowcaseOnEmpty()).toBe(true);
  });

  it("onEmpty off in production when SHOWCASE unset", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE", "");
    expect(shouldUseCommunityShowcaseOnEmpty()).toBe(false);
  });

  it("onEmpty off in production even when SHOWCASE=1 (production hard-off)", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE", "1");
    expect(shouldUseCommunityShowcaseOnEmpty()).toBe(false);
  });

  it("onEmpty off on testnet deploy profile (② density)", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE", "");
    vi.stubEnv("NEXT_PUBLIC_TRAVELTRUST_PHASE", "2");
    expect(shouldUseCommunityShowcaseOnEmpty()).toBe(false);
  });

  it("findCommunityShowcasePostById resolves curated demo posts", () => {
    expect(findCommunityShowcasePostById("tt-showcase-post-001")?.id).toBe("tt-showcase-post-001");
    expect(findCommunityShowcasePostById("real-post-uuid")).toBeUndefined();
  });

  it("isShowcasePostId matches injected demo post ids", () => {
    expect(isShowcasePostId("tt-showcase-post-010")).toBe(true);
    expect(isShowcasePostId("real-post-uuid")).toBe(false);
  });

  it("isShowcaseAuthorId matches demo authors", () => {
    expect(isShowcaseAuthorId("tt-demo-mei")).toBe(true);
    expect(isShowcaseAuthorId("user-123")).toBe(false);
  });
});
