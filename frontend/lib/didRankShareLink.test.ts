import { describe, expect, it } from "vitest";
import { buildDidRankSharePath } from "@/lib/didRankShareLink";

describe("buildDidRankSharePath", () => {
  it("builds traveler me deep link with period", () => {
    expect(buildDidRankSharePath("traveler", "abc", "month")).toBe(
      "/did-rank?me=traveler-abc&period=month",
    );
  });

  it("builds guide me deep link with board param", () => {
    expect(buildDidRankSharePath("guide", "g1", "all")).toBe("/did-rank?me=guide-g1&board=guide");
  });

  it("builds provider me deep link with board param", () => {
    expect(buildDidRankSharePath("provider", "p1", "week")).toBe(
      "/did-rank?me=provider-p1&period=week&board=provider",
    );
  });
});
