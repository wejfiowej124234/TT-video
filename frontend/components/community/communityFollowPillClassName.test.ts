import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { communityFollowPillClassName } from "./communityFollowPillClassName";

const repoRoot = join(__dirname, "../..");

function read(rel: string): string {
  return readFileSync(join(repoRoot, rel), "utf8");
}

describe("communityFollowPillClassName", () => {
  it("uses warm outline idle and muted following tokens", () => {
    expect(communityFollowPillClassName({ followed: false })).toContain("border-ref-sun/45");
    expect(communityFollowPillClassName({ followed: true })).toContain("text-slate-100");
  });

  it("supports compact size for aside rail", () => {
    expect(communityFollowPillClassName({ followed: false, size: "compact" })).toContain("min-h-[36px]");
  });
});

describe("communityFeedChromePath contract", () => {
  it("CommunityFeedMain uses DiscoveryChrome not legacy FilterBar", () => {
    const src = read("components/community/CommunityFeedMain.tsx");
    expect(src).toContain("CommunityFeedDiscoveryChrome");
    expect(src).not.toMatch(/import\s+CommunityFeedFilterBar/);
  });

  it("CommunityFeedMain uses CommunityFeedMainPortals for drawers", () => {
    const src = read("components/community/CommunityFeedMain.tsx");
    expect(src).toContain("CommunityFeedMainPortals");
    expect(src).not.toContain("PostDetailDrawerPortal");
    expect(src).not.toMatch(/detailPost\.is_video\s*===\s*true/);
  });

  it("CommunityFeedMainPortals routes comments via PostDetailDrawer only", () => {
    const src = read("components/community/CommunityFeedMainPortals.tsx");
    expect(src).toContain("CommunityFeedMainPostDetailPortal");
    expect(src).not.toContain("CommunityFeedMainCommentDrawerPortal");
    expect(src).not.toContain("CommentDrawerPortal");
  });

  it("PostDetailDrawerMetaSection uses shared follow pill helper", () => {
    const src = read("components/community/PostDetailDrawerMetaSection.tsx");
    expect(src).toContain("communityFollowPillClassName");
    expect(src).not.toContain("primaryCtaFilled");
  });
});
