import { describe, it, expect } from "vitest";
import {
  communityTagPostStatsFromEnvelope,
  parsePublicPostsByTagCountEnvelope,
  TRAVELTRUST_COMMUNITY_TAG_COUNT_CONTRACT_INVALID,
} from "./communityTagPostCountEnvelope";

describe("parsePublicPostsByTagCountEnvelope", () => {
  it("ok with post_count", () => {
    expect(parsePublicPostsByTagCountEnvelope({ status: "ok", post_count: 3 })).toEqual({
      kind: "ok",
      postCount: 3,
    });
  });

  it("rejects ok without finite post_count", () => {
    expect(parsePublicPostsByTagCountEnvelope({ status: "ok" })).toEqual({ kind: "invalid" });
    expect(parsePublicPostsByTagCountEnvelope({ status: "ok", post_count: "3" })).toEqual({ kind: "invalid" });
  });

  it("degraded with count", () => {
    expect(parsePublicPostsByTagCountEnvelope({ status: "degraded", post_count: 2 })).toEqual({
      kind: "degraded",
      postCount: 2,
    });
  });

  it("degraded without count", () => {
    expect(parsePublicPostsByTagCountEnvelope({ status: "degraded" })).toEqual({
      kind: "degraded",
      postCount: null,
    });
  });
});

describe("communityTagPostStatsFromEnvelope", () => {
  it("throws on invalid", () => {
    expect(() => communityTagPostStatsFromEnvelope({ status: "ok" })).toThrow(
      TRAVELTRUST_COMMUNITY_TAG_COUNT_CONTRACT_INVALID,
    );
  });

  it("returns count for ok", () => {
    expect(communityTagPostStatsFromEnvelope({ status: "ok", post_count: 5 })).toEqual({
      kind: "count",
      postCount: 5,
    });
  });

  it("returns count for degraded with number", () => {
    expect(communityTagPostStatsFromEnvelope({ status: "degraded", post_count: 2 })).toEqual({
      kind: "count",
      postCount: 2,
    });
  });

  it("returns degraded_unknown when degraded without count", () => {
    expect(communityTagPostStatsFromEnvelope({ status: "degraded", reason: "x" })).toEqual({
      kind: "degraded_unknown",
    });
  });
});
