import { describe, it, expect } from "vitest";
import { conversationsArrayFromEnvelope } from "./communityConversationsRead";

describe("conversationsArrayFromEnvelope", () => {
  it("returns [] for null / non-object / array root", () => {
    expect(conversationsArrayFromEnvelope(null)).toEqual([]);
    expect(conversationsArrayFromEnvelope(undefined)).toEqual([]);
    expect(conversationsArrayFromEnvelope([])).toEqual([]);
    expect(conversationsArrayFromEnvelope("x")).toEqual([]);
  });

  it("returns [] when conversations missing or not array", () => {
    expect(conversationsArrayFromEnvelope({ status: "degraded" })).toEqual([]);
    expect(conversationsArrayFromEnvelope({ status: "ok", conversations: null })).toEqual([]);
    expect(conversationsArrayFromEnvelope({ status: "ok", conversations: {} as unknown })).toEqual([]);
  });

  it("returns array when conversations is array", () => {
    const rows = [{ id: "c1", user1_id: "a", user2_id: "b", created_at: "t" }];
    expect(conversationsArrayFromEnvelope({ status: "ok", conversations: rows })).toEqual(rows);
  });
});
