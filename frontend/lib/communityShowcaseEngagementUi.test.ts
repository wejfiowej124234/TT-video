import { describe, expect, it } from "vitest";
import {
  communityShowcaseEngagementButtonAria,
  communityShowcaseEngagementCountClassName,
} from "@/lib/communityShowcaseEngagementUi";

const t = (key: string) => key;

describe("communityShowcaseEngagementUi", () => {
  it("appends demo aria suffix for showcase posts only", () => {
    expect(communityShowcaseEngagementButtonAria(t, "community_like", 89, "tt-showcase-post-001")).toBe(
      "community_like, 89, community_showcase_engagement_demo_aria",
    );
    expect(communityShowcaseEngagementButtonAria(t, "community_like", 12, "real-post-1")).toBe(
      "community_like, 12",
    );
  });

  it("mutes showcase engagement count styling", () => {
    expect(communityShowcaseEngagementCountClassName("tt-showcase-post-001")).toContain("text-slate-500/55");
    expect(communityShowcaseEngagementCountClassName("real-post-1")).toContain("text-slate-200");
  });
});
