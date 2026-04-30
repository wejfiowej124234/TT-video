import { describe, it, expect } from "vitest";
import { parseCommunityFeedPageEnvelope } from "./communityFeedPageEnvelope";

describe("parseCommunityFeedPageEnvelope", () => {
  it("ok with posts and cursor", () => {
    expect(
      parseCommunityFeedPageEnvelope({
        status: "ok",
        posts: [{ id: "1" }],
        next_cursor: "  c  ",
      }),
    ).toEqual({ kind: "ok", posts: [{ id: "1" }], nextCursor: "c" });
  });

  it("ok trims empty next_cursor to null", () => {
    expect(parseCommunityFeedPageEnvelope({ status: "ok", posts: [], next_cursor: "   " })).toEqual({
      kind: "ok",
      posts: [],
      nextCursor: null,
    });
  });

  it("rejects ok without posts array", () => {
    expect(parseCommunityFeedPageEnvelope({ status: "ok", posts: {} })).toEqual({ kind: "invalid" });
  });

  it("rejects bad next_cursor type on ok", () => {
    expect(parseCommunityFeedPageEnvelope({ status: "ok", posts: [], next_cursor: 1 })).toEqual({
      kind: "invalid",
    });
  });

  it("degraded allows missing posts", () => {
    const env = { status: "degraded", reason: "db" };
    expect(parseCommunityFeedPageEnvelope(env)).toEqual({
      kind: "degraded",
      posts: [],
      envelope: env,
    });
  });

  it("degraded keeps posts when array", () => {
    const env = { status: "degraded", posts: [{ id: "x" }] };
    expect(parseCommunityFeedPageEnvelope(env)).toEqual({
      kind: "degraded",
      posts: [{ id: "x" }],
      envelope: env,
    });
  });

  it("rejects unknown status", () => {
    expect(parseCommunityFeedPageEnvelope({ status: "error", posts: [] })).toEqual({ kind: "invalid" });
  });
});
