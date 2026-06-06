import { describe, expect, it } from "vitest";
import { isAssignedGuideId, isOrderEligibleForDiscoverMarketState, isOrderPublishedToDiscover } from "./isAssignedGuideId";

describe("isAssignedGuideId", () => {
  it("rejects nil and empty guide ids", () => {
    expect(isAssignedGuideId(null)).toBe(false);
    expect(isAssignedGuideId("")).toBe(false);
    expect(isAssignedGuideId("00000000-0000-0000-0000-000000000000")).toBe(false);
  });

  it("accepts real guide ids", () => {
    expect(isAssignedGuideId("00000000-0000-4000-8000-000000000001")).toBe(true);
  });
});

describe("isOrderEligibleForDiscoverMarketState", () => {
  it("matches draft/created/open for discover market", () => {
    expect(isOrderEligibleForDiscoverMarketState("draft")).toBe(true);
    expect(isOrderEligibleForDiscoverMarketState("created")).toBe(true);
    expect(isOrderEligibleForDiscoverMarketState("open")).toBe(true);
    expect(isOrderEligibleForDiscoverMarketState("accepted")).toBe(false);
  });
});

describe("isOrderPublishedToDiscover", () => {
  it("matches created/open", () => {
    expect(isOrderPublishedToDiscover("created")).toBe(true);
    expect(isOrderPublishedToDiscover("open")).toBe(true);
    expect(isOrderPublishedToDiscover("draft")).toBe(false);
  });
});
