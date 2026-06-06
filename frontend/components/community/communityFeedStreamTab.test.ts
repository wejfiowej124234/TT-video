import { describe, expect, it } from "vitest";
import {
  feedStreamTabFromState,
  isMasonryFeedStream,
} from "./communityFeedStreamTab";

describe("communityFeedStreamTab", () => {
  it("maps following tab", () => {
    expect(feedStreamTabFromState("following", "latest", "all")).toBe("following");
    expect(isMasonryFeedStream("following", "latest", "all")).toBe(true);
  });

  it("maps hot sort on recommend", () => {
    expect(feedStreamTabFromState("recommend", "hot", "all")).toBe("hot");
    expect(isMasonryFeedStream("recommend", "hot", "all")).toBe(true);
  });

  it("maps destination filter on recommend", () => {
    expect(feedStreamTabFromState("recommend", "latest", "厦门")).toBe("destination");
    expect(isMasonryFeedStream("recommend", "latest", "厦门")).toBe(true);
  });

  it("defaults to recommend stream", () => {
    expect(feedStreamTabFromState("recommend", "latest", "all")).toBe("recommend");
    expect(isMasonryFeedStream("recommend", "latest", "all")).toBe(true);
  });
});
