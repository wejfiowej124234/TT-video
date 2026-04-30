import { describe, expect, it } from "vitest";
import {
  countCommunityMeSocialList,
  countCommunityRequestsEnvelope,
  countCommunityCollectsEnvelope,
} from "./communityMeSocialListsContract";

describe("countCommunityMeSocialList", () => {
  it("counts when field is array", () => {
    expect(countCommunityMeSocialList({ following: [{ id: "1" }] }, "following")).toEqual({ kind: "ok", n: 1 });
    expect(countCommunityMeSocialList({ followers: [] }, "followers")).toEqual({ kind: "ok", n: 0 });
  });

  it("invalid when missing or not array", () => {
    expect(countCommunityMeSocialList({ following: {} }, "following")).toEqual({ kind: "invalid" });
    expect(countCommunityMeSocialList({}, "following")).toEqual({ kind: "invalid" });
    expect(countCommunityMeSocialList(null, "friends")).toEqual({ kind: "invalid" });
  });
});

describe("countCommunityCollectsEnvelope", () => {
  it("returns items when collects is array", () => {
    expect(countCommunityCollectsEnvelope({ collects: [] })).toEqual({ kind: "ok", items: [] });
  });
  it("invalid when collects not array", () => {
    expect(countCommunityCollectsEnvelope({ collects: {} })).toEqual({ kind: "invalid" });
  });
});

describe("countCommunityRequestsEnvelope", () => {
  it("returns items when requests is array", () => {
    expect(countCommunityRequestsEnvelope({ requests: [{ id: "1" }] })).toEqual({
      kind: "ok",
      items: [{ id: "1" }],
    });
  });
  it("invalid when requests missing or not array", () => {
    expect(countCommunityRequestsEnvelope({ requests: null })).toEqual({ kind: "invalid" });
    expect(countCommunityRequestsEnvelope({})).toEqual({ kind: "invalid" });
  });
});
