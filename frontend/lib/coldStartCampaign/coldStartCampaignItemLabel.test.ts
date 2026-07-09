import { describe, expect, it } from "vitest";

import { coldStartCampaignItemLabel } from "./coldStartCampaignItemLabel";
import type { ColdStartCampaignItem } from "./types";

function item(partial: Partial<ColdStartCampaignItem>): ColdStartCampaignItem {
  return {
    item_type: "community_post",
    item_id: "x",
    resolved: {},
    ...partial,
  } as ColdStartCampaignItem;
}

describe("coldStartCampaignItemLabel", () => {
  it("uses community post body first line instead of item_type", () => {
    const label = coldStartCampaignItemLabel(
      item({
        item_type: "community_post",
        resolved: { body: "Dubai skyline notes\nmore text" },
      }),
    );
    expect(label).toBe("Dubai skyline notes");
    expect(label).not.toBe("community post");
  });

  it("uses market listing payload title instead of item_type", () => {
    const label = coldStartCampaignItemLabel(
      item({
        item_type: "market_listing",
        resolved: { payload: { title: "OCS Provider · Barcelona" } },
      }),
    );
    expect(label).toBe("OCS Provider · Barcelona");
  });

  it("falls back to destination when community body missing", () => {
    const label = coldStartCampaignItemLabel(
      item({
        item_type: "community_post",
        resolved: { destination: "Sydney" },
      }),
    );
    expect(label).toBe("Sydney");
  });
});
