import { describe, expect, it } from "vitest";
import {
  communityTopicPathForTag,
  communityTopicTagExceedsFeedQueryLimit,
  feedSortQuerySuffix,
  normalizeCommunityTopicTagFromSearchInput,
  parseCommunityFeedSortFromQuery,
  pathnameWithFeedSort,
} from "./communityFeedSortUrl";

describe("parseCommunityFeedSortFromQuery", () => {
  it("treats hot (case-insensitive, trim) as hot", () => {
    expect(parseCommunityFeedSortFromQuery("hot")).toBe("hot");
    expect(parseCommunityFeedSortFromQuery("  HOT  ")).toBe("hot");
  });

  it("defaults to latest for missing or other values", () => {
    expect(parseCommunityFeedSortFromQuery(null)).toBe("latest");
    expect(parseCommunityFeedSortFromQuery(undefined)).toBe("latest");
    expect(parseCommunityFeedSortFromQuery("")).toBe("latest");
    expect(parseCommunityFeedSortFromQuery("hottest")).toBe("latest");
    expect(parseCommunityFeedSortFromQuery("latest")).toBe("latest");
  });
});

describe("communityTopicPathForTag", () => {
  it("encodes tag and omits query for latest", () => {
    expect(communityTopicPathForTag("  foo bar  ", "latest")).toBe("/community/topic/foo%20bar");
  });

  it("appends sort=hot for hot", () => {
    expect(communityTopicPathForTag("x", "hot")).toBe("/community/topic/x?sort=hot");
  });
});

describe("feedSortQuerySuffix", () => {
  it("matches topic navigation convention", () => {
    expect(feedSortQuerySuffix("latest")).toBe("");
    expect(feedSortQuerySuffix("hot")).toBe("?sort=hot");
  });
});

describe("pathnameWithFeedSort", () => {
  it("sets or removes sort only", () => {
    expect(pathnameWithFeedSort("/community", "", "hot")).toBe("/community?sort=hot");
    expect(pathnameWithFeedSort("/community", "?sort=hot", "latest")).toBe("/community");
    const withTag = pathnameWithFeedSort("/community/topic/a", "?tag=b", "hot");
    expect(new URL(`http://x${withTag}`).searchParams.get("sort")).toBe("hot");
    expect(new URL(`http://x${withTag}`).searchParams.get("tag")).toBe("b");
  });
});

describe("normalizeCommunityTopicTagFromSearchInput", () => {
  it("trims and strips leading hash", () => {
    expect(normalizeCommunityTopicTagFromSearchInput("  #京都  ")).toBe("京都");
    expect(normalizeCommunityTopicTagFromSearchInput("food")).toBe("food");
    expect(normalizeCommunityTopicTagFromSearchInput("   ")).toBe("");
  });
});

describe("communityTopicTagExceedsFeedQueryLimit", () => {
  it("delegates to server UTF-8 limit", () => {
    expect(communityTopicTagExceedsFeedQueryLimit("")).toBe(false);
    expect(communityTopicTagExceedsFeedQueryLimit("a".repeat(65))).toBe(true);
  });
});
