import { describe, expect, it } from "vitest";
import { communityPostTagDisplayLabel, communityPostTagsForDisplay } from "./communityPostTagDisplay";

describe("communityPostTagDisplayLabel", () => {
  it("strips leading hash marks", () => {
    expect(communityPostTagDisplayLabel("摄影")).toBe("摄影");
    expect(communityPostTagDisplayLabel("#摄影")).toBe("摄影");
    expect(communityPostTagDisplayLabel("##京都")).toBe("京都");
  });
});

describe("communityPostTagsForDisplay", () => {
  it("drops empty and hash-only tags", () => {
    expect(communityPostTagsForDisplay(["#摄影", "", "#", "  "])).toEqual(["#摄影"]);
  });
});
