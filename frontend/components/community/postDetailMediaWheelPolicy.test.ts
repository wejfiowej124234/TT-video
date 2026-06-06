import { describe, expect, it } from "vitest";
import { shouldEnablePostDetailVideoFeedWheel } from "./postDetailMediaWheelPolicy";

describe("postDetailMediaWheelPolicy", () => {
  it("enables feed wheel on media stage at all viewport widths", () => {
    expect(shouldEnablePostDetailVideoFeedWheel(390)).toBe(true);
    expect(shouldEnablePostDetailVideoFeedWheel(768)).toBe(true);
    expect(shouldEnablePostDetailVideoFeedWheel(1280)).toBe(true);
  });
});
