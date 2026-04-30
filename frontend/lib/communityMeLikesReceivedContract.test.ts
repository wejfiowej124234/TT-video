import { describe, expect, it } from "vitest";
import { parseCommunityMeLikesReceivedResponse } from "./communityMeLikesReceivedContract";

describe("parseCommunityMeLikesReceivedResponse", () => {
  it("accepts ok integer", () => {
    expect(parseCommunityMeLikesReceivedResponse({ status: "ok", likes_received: 3 })).toEqual({
      kind: "ok",
      n: 3,
    });
  });

  it("floors and clamps negatives via invalid", () => {
    expect(parseCommunityMeLikesReceivedResponse({ status: "ok", likes_received: -1 })).toEqual({
      kind: "invalid",
      reason: "negative",
    });
  });

  it("accepts numeric string", () => {
    expect(parseCommunityMeLikesReceivedResponse({ status: "ok", likes_received: "12.7" })).toEqual({
      kind: "ok",
      n: 12,
    });
  });

  it("rejects missing field", () => {
    expect(parseCommunityMeLikesReceivedResponse({ status: "ok" })).toEqual({
      kind: "invalid",
      reason: "missing",
    });
  });

  it("rejects bad type", () => {
    expect(parseCommunityMeLikesReceivedResponse({ status: "ok", likes_received: {} })).toEqual({
      kind: "invalid",
      reason: "bad_type",
    });
  });

  it("accepts degraded with valid count", () => {
    expect(parseCommunityMeLikesReceivedResponse({ status: "degraded", likes_received: 0 })).toEqual({
      kind: "ok",
      n: 0,
    });
  });
});
