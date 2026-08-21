import { describe, expect, it } from "vitest";
import {
  OFFICIAL_WWW_ANNOUNCEMENT_CAMPAIGN_CHIP,
  OFFICIAL_WWW_ANNOUNCEMENT_FILTER_CHIPS,
} from "./traveltrustOfficialAnnouncementChipOverlay";
import { filterAnnouncementsByChip } from "./hooks/useTraveltrustCmsAnnouncements";
import type { TravelTrustAnnouncementDisplay } from "./traveltrustCmsAnnouncements";

describe("Official www announcement chip overlay", () => {
  it("locks live 5 chips including campaign/活动 between product and governance", () => {
    expect([...OFFICIAL_WWW_ANNOUNCEMENT_FILTER_CHIPS]).toEqual([
      "all",
      "product",
      "campaign",
      "governance",
      "protocol_status",
    ]);
    expect(OFFICIAL_WWW_ANNOUNCEMENT_CAMPAIGN_CHIP).toBe("campaign");
    expect(OFFICIAL_WWW_ANNOUNCEMENT_FILTER_CHIPS).toHaveLength(5);
  });

  it("filters campaign by kind without mixing protocol/governance lanes", () => {
    const items = [
      { id: "p", lane: "product", kind: "product" },
      { id: "c", lane: "product", kind: "campaign" },
      { id: "g", lane: "governance", kind: "product" },
    ] as TravelTrustAnnouncementDisplay[];
    expect(filterAnnouncementsByChip(items, "campaign").map((i) => i.id)).toEqual(["c"]);
    expect(filterAnnouncementsByChip(items, "product").map((i) => i.id)).toEqual(["p"]);
    expect(filterAnnouncementsByChip(items, "all").map((i) => i.id)).toEqual(["p", "c", "g"]);
  });
});
