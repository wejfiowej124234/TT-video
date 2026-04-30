import { describe, expect, it } from "vitest";
import { apiDisputeSliceMatchesRoute, parseApiDisputeId } from "./disputeGetEnvelopeGuard";

describe("disputeGetEnvelopeGuard", () => {
  it("parseApiDisputeId", () => {
    expect(parseApiDisputeId({ id: "  d1  " })).toBe("d1");
    expect(parseApiDisputeId({})).toBeNull();
    expect(parseApiDisputeId(null)).toBeNull();
  });

  it("apiDisputeSliceMatchesRoute", () => {
    const id = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    expect(apiDisputeSliceMatchesRoute({ id }, id)).toBe(true);
    expect(apiDisputeSliceMatchesRoute({ id: "other" }, id)).toBe(false);
  });
});
