import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PUBLISH_HUB_PATH } from "@/lib/me/publishHubL5";
import { PUBLISH_HUB_RAILS } from "@/lib/me/publishHubModel";

const ROOT = process.cwd();

describe("publish hub page (Phase A-1 · /me/publish)", () => {
  const page = readFileSync(join(ROOT, "app/me/publish/page.tsx"), "utf8");
  const layout = readFileSync(join(ROOT, "app/me/publish/layout.tsx"), "utf8");
  const main = readFileSync(join(ROOT, "app/me/publish/PublishHubPageMain.tsx"), "utf8");
  const itemCard = readFileSync(join(ROOT, "components/me/publish/PublishHubItemCard.tsx"), "utf8");
  const tripRail = readFileSync(join(ROOT, "components/me/publish/PublishHubTripRailSection.tsx"), "utf8");
  const uiSystem = readFileSync(join(ROOT, "lib/uiSystem.ts"), "utf8");
  const readme = readFileSync(join(ROOT, "app/me/publish/README.md"), "utf8");

  it("route and metadata SSOT", () => {
    expect(PUBLISH_HUB_PATH).toBe("/me/publish");
    expect(page).toContain("PublishHubPageMain");
    expect(layout).toContain("publish_hub_meta_title");
    expect(layout).toContain('canonical: "/me/publish"');
  });

  it("five functional rails filter model on page", () => {
    expect(PUBLISH_HUB_RAILS).toEqual([
      "all",
      "trip",
      "guide",
      "merchant",
      "acquisition",
      "governance",
    ]);
    expect(main).toContain("data-tt-publish-hub-filters");
    expect(main).toContain("data-tt-publish-hub-rail={rail}");
    expect(main).toContain("data-tt-publish-hub-rail={config.rail}");
    expect(main).toContain("usePublishHubAcquisitionListings");
    expect(main).toContain("usePublishHubTripOrders");
    expect(main).toContain("usePublishHubGovernanceRail");
    expect(main).toContain("publishHubFilterFromSearchParams");
    expect(main).toContain('slotById("region_steward")');
    expect(main).not.toMatch(/slotById\("steward"\)/);
    expect(main).toContain("usePublishHubGuideRail");
    expect(main).not.toContain("usePublishHubCommunityPreview");
    expect(main).not.toContain('data-tt-publish-hub-rail="community"');
    expect(main).toContain("usePublishHubServerSummary");
    expect(main).toContain("publishHubFilterFromIdentityParam");
    expect(
      readFileSync(join(ROOT, "app/api/v1/me/publish-summary/route.ts"), "utf8"),
    ).toContain("PUBLISH_HUB_SUMMARY_BFF_IMPL_STATUS");
    expect(itemCard).toContain("data-tt-publish-hub-item-card");
    expect(tripRail).toContain("PublishHubItemList");
    expect(tripRail).toContain("mapPublishHubTripItems");
    expect(main).toContain("publishHubVisibleContentRails");
  });

  it("auth L5 header path registered", () => {
    expect(uiSystem).toContain('"/me/publish"');
  });

  it("README points to frozen design SSOT", () => {
    expect(readme).toContain("PUBLISH-HUB-L5-DESIGN.md");
    expect(readme).toContain("publishHubPage");
  });
});
