import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(process.cwd(), "components", "community");

function read(name: string): string {
  return readFileSync(join(ROOT, name), "utf8");
}

describe("phase29 W2 community feed polish (RP-013)", () => {
  it("feed list exposes loading hint with polite live region", () => {
    const feedList = read("CommunityFeedList.tsx");
    expect(feedList).toContain('aria-live="polite"');
    expect(feedList).toContain("community_feed_loading_hint");
  });

  it("feed skeletons use loading hint aria-label", () => {
    const skeleton = read("FeedSkeleton.tsx");
    expect(skeleton).toContain("community_feed_loading_hint");
  });
});
