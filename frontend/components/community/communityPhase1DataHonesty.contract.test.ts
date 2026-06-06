import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "../..");

function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

/** ① L5 数据诚实机读锚点（2026-06-03 深度审计补闭 · 不改 UI 结构） */
describe("community phase 1 data honesty anchors (contract)", () => {
  it("feed search mode and showcase notice data-tt", () => {
    const chrome = read("components/community/CommunityFeedDiscoveryChrome.tsx");
    expect(chrome).toContain("data-tt-community-feed-search-mode=");
    expect(chrome).toContain("api-text-q-v1");
    expect(chrome).toContain("client-filter-topic-v1");
    expect(chrome).toContain("community_search_dual_mode_hint");

    const notice = read("components/community/CommunityFeedShowcaseNotice.tsx");
    expect(notice).toContain('data-tt-community-feed-showcase="active-v1"');
  });

  it("activity page declares likes-summary scope only", () => {
    const activity = read("app/community/activity/page.tsx");
    expect(activity).toContain("data-tt-community-activity-scope=");
    expect(activity).toContain("getMeActivity");
    expect(activity).toContain("community_activity_scope_sr_hint");
  });

  it("feedback list panel exposes server vs local-mixed source", () => {
    const panel = read("app/community/feedback/CommunityFeedbackListPanel.tsx");
    expect(panel).toContain("data-tt-community-feedback-list-source");
    expect(panel).toContain('"server"');
    expect(panel).toContain('"local-mixed"');
    expect(read("app/community/feedback/useCommunityFeedbackRemoteList.ts")).toContain("getFeedbackList");
  });

  it("explore destinations catalog disclosure (API aggregate or static fallback)", () => {
    const section = read("app/community/explore/CommunityExplorePageDestinationsSection.tsx");
    const hook = read("app/community/explore/useCommunityExplorePage.ts");
    expect(section).toContain("data-tt-community-explore-dest-catalog=");
    expect(section).toContain("exploreDestCatalog");
    expect(hook).toContain("getExploreDestinations");
    expect(hook).toContain("api-aggregate-v1");
    expect(hook).toContain("static-v1");
  });
});
