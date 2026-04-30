import { describe, expect, it } from "vitest";
import {
  parseMeCollectsListEnvelope,
  parseMeLikesListEnvelope,
  parseMyPostsPageEnvelope,
} from "./communityMeDrawerListContracts";

describe("parseMeLikesListEnvelope", () => {
  it("accepts empty array", () => {
    expect(parseMeLikesListEnvelope({ status: "ok", likes: [] })).toEqual({ kind: "ok", value: [] });
  });

  it("rejects missing likes", () => {
    expect(parseMeLikesListEnvelope({ status: "ok" })).toEqual({ kind: "invalid", reason: "bad_shape" });
  });

  it("rejects non-array likes", () => {
    expect(parseMeLikesListEnvelope({ status: "ok", likes: {} })).toEqual({ kind: "invalid", reason: "bad_shape" });
  });

  it("extracts post_id", () => {
    expect(
      parseMeLikesListEnvelope({
        status: "ok",
        likes: [{ post_id: "a" }, { post_id: "" }, { foo: 1 }],
      }),
    ).toEqual({ kind: "ok", value: ["a"] });
  });
});

describe("parseMeCollectsListEnvelope", () => {
  it("accepts degraded with collects", () => {
    expect(parseMeCollectsListEnvelope({ status: "degraded", collects: [] })).toEqual({ kind: "ok", value: [] });
  });

  it("rejects missing collects", () => {
    expect(parseMeCollectsListEnvelope({ status: "ok", note: "x" })).toEqual({ kind: "invalid", reason: "bad_shape" });
  });
});

describe("parseMyPostsPageEnvelope", () => {
  it("accepts posts and trims cursor", () => {
    expect(parseMyPostsPageEnvelope({ status: "ok", posts: [{ id: "1" }], next_cursor: "  c  " })).toEqual({
      kind: "ok",
      value: { posts: [{ id: "1" }], next_cursor: "c" },
    });
  });

  it("rejects bad next_cursor type", () => {
    expect(parseMyPostsPageEnvelope({ status: "ok", posts: [], next_cursor: 1 })).toEqual({
      kind: "invalid",
      reason: "bad_shape",
    });
  });

  it("rejects missing posts", () => {
    expect(parseMyPostsPageEnvelope({ status: "ok" })).toEqual({ kind: "invalid", reason: "bad_shape" });
  });

  it("accepts degraded with posts array (user/me posts 同源)", () => {
    expect(parseMyPostsPageEnvelope({ status: "degraded", posts: [], note: "x" })).toEqual({
      kind: "ok",
      value: { posts: [], next_cursor: "" },
    });
  });
});
