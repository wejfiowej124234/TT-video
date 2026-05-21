import { describe, expect, it } from "vitest";
import { TRAVELTRUST_NETWORK_ANNOUNCEMENTS } from "@/lib/traveltrustNetworkAnnouncements";
import {
  assertTraveltrustAnnouncementHrefs,
  isTraveltrustV6AllowedHref,
} from "@/lib/traveltrustFundraisingLinkPolicy";

describe("traveltrustFundraisingLinkPolicy (TT-PH1-111/112)", () => {
  it("allows internal product routes", () => {
    expect(isTraveltrustV6AllowedHref("/governance")).toBe(true);
    expect(isTraveltrustV6AllowedHref("/help#disclosure")).toBe(true);
    expect(isTraveltrustV6AllowedHref("#start")).toBe(true);
  });

  it("blocks fundraising and absolute URLs", () => {
    expect(isTraveltrustV6AllowedHref("https://example.com/deck")).toBe(false);
    expect(isTraveltrustV6AllowedHref("/docs/fundraising/external")).toBe(false);
    expect(isTraveltrustV6AllowedHref("/whitepaper")).toBe(false);
  });

  it("pulse announcements stay on-policy", () => {
    expect(assertTraveltrustAnnouncementHrefs(TRAVELTRUST_NETWORK_ANNOUNCEMENTS)).toEqual([]);
  });
});
