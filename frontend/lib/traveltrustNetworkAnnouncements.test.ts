import { describe, expect, it } from "vitest";
import {
  TRAVELTRUST_ANNOUNCEMENTS_PATH,
  TRAVELTRUST_NETWORK_ANNOUNCEMENTS,
  listTraveltrustNetworkAnnouncementsNewestFirst,
  traveltrustAnnouncementPageHref,
} from "./traveltrustNetworkAnnouncements";

describe("traveltrustNetworkAnnouncements", () => {
  it("listTraveltrustNetworkAnnouncementsNewestFirst sorts by at descending", () => {
    const sorted = listTraveltrustNetworkAnnouncementsNewestFirst();
    expect(sorted.length).toBe(TRAVELTRUST_NETWORK_ANNOUNCEMENTS.length);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1]!.at >= sorted[i]!.at).toBe(true);
    }
    expect(sorted[0]?.id).toBe("v6-cinematic");
  });

  it("traveltrustAnnouncementPageHref lands on announcements archive", () => {
    expect(traveltrustAnnouncementPageHref()).toBe(TRAVELTRUST_ANNOUNCEMENTS_PATH);
    expect(traveltrustAnnouncementPageHref("escrow-usdc")).toBe(
      `${TRAVELTRUST_ANNOUNCEMENTS_PATH}#escrow-usdc`,
    );
  });
});
