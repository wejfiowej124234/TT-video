import { describe, expect, it } from "vitest";
import { pickCommunityFeedAutoplayPostId } from "./pickCommunityFeedAutoplayPostId";

describe("pickCommunityFeedAutoplayPostId", () => {
  it("picks highest ratio above threshold", () => {
    const map = new Map([
      ["a", 0.6],
      ["b", 0.85],
      ["c", 0.4],
    ]);
    expect(pickCommunityFeedAutoplayPostId(map)).toBe("b");
  });

  it("returns null when nothing meets min ratio", () => {
    const map = new Map([
      ["a", 0.2],
      ["b", 0.5],
    ]);
    expect(pickCommunityFeedAutoplayPostId(map)).toBeNull();
  });

  it("respects custom min ratio", () => {
    const map = new Map([["a", 0.48]]);
    expect(pickCommunityFeedAutoplayPostId(map, 0.45)).toBe("a");
    expect(pickCommunityFeedAutoplayPostId(map, 0.55)).toBeNull();
  });
});
