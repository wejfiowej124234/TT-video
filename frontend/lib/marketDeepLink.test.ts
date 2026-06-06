import { describe, expect, it } from "vitest";
import {
  MARKET_ITINERARY_DRAFT_QUERY,
  buildPathStrippingItineraryDraftQuery,
  ITINERARY_NEW_FALLBACK_PATH,
} from "./marketDeepLink";

describe("buildPathStrippingItineraryDraftQuery", () => {
  it("removes itinerary_draft_id and keeps other params", () => {
    const sp = new URLSearchParams(
      `foo=1&${MARKET_ITINERARY_DRAFT_QUERY}=550e8400-e29b-41d4-a716-446655440000&bar=2`,
    );
    expect(buildPathStrippingItineraryDraftQuery("/itinerary/new", sp)).toBe("/itinerary/new?foo=1&bar=2");
  });

  it("uses fallback path when pathname empty", () => {
    const sp = new URLSearchParams(`${MARKET_ITINERARY_DRAFT_QUERY}=x`);
    expect(buildPathStrippingItineraryDraftQuery("", sp)).toBe(ITINERARY_NEW_FALLBACK_PATH);
  });
});
