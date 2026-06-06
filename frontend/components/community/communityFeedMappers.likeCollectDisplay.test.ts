import { describe, expect, it } from "vitest";
import {
  displayCollectCountFromServerAndUi,
  displayLikeCountFromServerAndUi,
  engagementCollectsDeltaAfterWriteOk,
  engagementLikesDeltaAfterWriteOk,
} from "./communityFeedMappers";

describe("displayLikeCountFromServerAndUi / displayCollectCountFromServerAndUi (04 A3)", () => {
  it("does not double-count when server already includes me", () => {
    expect(displayLikeCountFromServerAndUi(5, true, true)).toBe(5);
    expect(displayCollectCountFromServerAndUi(3, true, true)).toBe(3);
  });

  it("optimistic +1 when UI liked but server not yet", () => {
    expect(displayLikeCountFromServerAndUi(4, true, false)).toBe(5);
    expect(displayCollectCountFromServerAndUi(2, true, undefined)).toBe(3);
  });

  it("optimistic -1 when UI unliked but server still has me", () => {
    expect(displayLikeCountFromServerAndUi(5, false, true)).toBe(4);
    expect(displayCollectCountFromServerAndUi(1, false, true)).toBe(0);
  });

  it("stable when UI matches anonymous or server snapshot (no double-count)", () => {
    expect(displayLikeCountFromServerAndUi(7, false, undefined)).toBe(7);
    expect(displayLikeCountFromServerAndUi(7, false, false)).toBe(7);
    expect(displayCollectCountFromServerAndUi(4, false, undefined)).toBe(4);
  });

  it("unlike does not produce negative display from zero aggregate", () => {
    expect(displayLikeCountFromServerAndUi(0, false, true)).toBe(0);
    expect(displayCollectCountFromServerAndUi(0, false, true)).toBe(0);
  });

  it("optimistic first like/collect from zero server aggregate", () => {
    expect(displayLikeCountFromServerAndUi(0, true, false)).toBe(1);
    expect(displayCollectCountFromServerAndUi(0, true, false)).toBe(1);
  });
});

describe("engagementLikesDeltaAfterWriteOk / engagementCollectsDeltaAfterWriteOk (API created flag)", () => {
  it("new like increments only when created", () => {
    expect(engagementLikesDeltaAfterWriteOk(true, { status: "ok", created: true })).toBe(1);
    expect(engagementLikesDeltaAfterWriteOk(true, { status: "ok", created: false })).toBe(0);
  });

  it("unlike always -1 on ok", () => {
    expect(engagementLikesDeltaAfterWriteOk(false, { status: "ok" })).toBe(-1);
  });

  it("non-ok yields 0", () => {
    expect(engagementLikesDeltaAfterWriteOk(true, { status: "error" })).toBe(0);
    expect(engagementLikesDeltaAfterWriteOk(false, null)).toBe(0);
  });

  it("collect mirrors like", () => {
    expect(engagementCollectsDeltaAfterWriteOk(true, { status: "ok", created: true })).toBe(1);
    expect(engagementCollectsDeltaAfterWriteOk(true, { status: "ok", created: false })).toBe(0);
    expect(engagementCollectsDeltaAfterWriteOk(false, { status: "ok" })).toBe(-1);
  });
});
