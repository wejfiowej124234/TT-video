import { describe, it, expect } from "vitest";
import { parseCommunityFeedbackListEnvelope } from "./communityFeedbackListEnvelope";

describe("parseCommunityFeedbackListEnvelope", () => {
  it("ok with items", () => {
    expect(parseCommunityFeedbackListEnvelope({ status: "ok", items: [{ id: "1" }] })).toEqual({
      kind: "ok",
      items: [{ id: "1" }],
    });
  });

  it("rejects ok without items array", () => {
    expect(parseCommunityFeedbackListEnvelope({ status: "ok", items: {} })).toEqual({ kind: "invalid" });
  });

  it("degraded allows missing items", () => {
    const env = { status: "degraded", reason: "x" };
    expect(parseCommunityFeedbackListEnvelope(env)).toEqual({
      kind: "degraded",
      items: [],
      envelope: env,
    });
  });
});
