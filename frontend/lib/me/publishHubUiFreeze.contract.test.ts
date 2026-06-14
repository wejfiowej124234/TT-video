import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PUBLISH_HUB_HEADER_NAV,
  PUBLISH_HUB_PHASE_A_ITEMS,
  PUBLISH_HUB_PHASE_A_SPRINT_MARKER,
} from "@/lib/me/publishHubPhaseAModel";
import { PUBLISH_HUB_PATH, publishHubL5MainDataAttrs } from "@/lib/me/publishHubL5";
import { PUBLISH_HUB_PHASE_A_ACTIVE_RAILS } from "@/lib/me/publishHubModel";

const ROOT = process.cwd();

describe("publish hub UI freeze (PUBLISH-HUB-L5-DESIGN · FROZEN)", () => {
  const designDoc = readFileSync(
    join(ROOT, "evidence/GO_local_auth_l5/PUBLISH-HUB-L5-DESIGN.md"),
    "utf8",
  );
  const pageMain = readFileSync(join(ROOT, "app/me/publish/PublishHubPageMain.tsx"), "utf8");
  const itemCard = readFileSync(join(ROOT, "components/me/publish/PublishHubItemCard.tsx"), "utf8");
  const itemModel = readFileSync(join(ROOT, "lib/me/publishHubItemModel.ts"), "utf8");
  const l5 = readFileSync(join(ROOT, "lib/me/publishHubL5.ts"), "utf8");
  const navModel = readFileSync(join(ROOT, "components/header/headerUserMenuNavModel.ts"), "utf8");

  it("design SSOT is frozen and declares /me/publish", () => {
    expect(designDoc).toContain("**FROZEN**");
    expect(designDoc).toContain("`/me/publish`");
    expect(designDoc).toContain("header_userMenu_publish_hub");
    expect(designDoc).toContain("我的帖子");
    expect(designDoc).toContain("PUBLISH-HUB-PHASE-TASK-LIST.md");
  });

  it("L5 data attrs match design probes", () => {
    expect(publishHubL5MainDataAttrs()).toEqual({
      "data-tt-publish-hub": "1",
      "data-tt-publish-hub-ui-frozen": "1",
      "data-tt-auth-visual": "l5",
      "data-tt-publish-hub-route": "publish",
      "data-tt-publish-hub-l5-closure-probe": "publish-hub-full-v1",
      "data-tt-ui-frozen": "publish-hub-l5-20260612",
      "data-tt-publish-hub-ia-boundary-frozen": "1",
      "data-tt-ui-frozen-ia-boundary": "publish-hub-ia-boundary-20260613",
    });
    expect(l5).toContain("PUBLISH-HUB-L5-DESIGN.md");
  });

  it("page uses Auth L5 flow shell and listing inventory rails", () => {
    expect(pageMain).toContain("MeSettingsL5FlowPage");
    expect(pageMain).toContain("PublishHubListingInventory");
    expect(itemCard).toContain("data-tt-publish-hub-item-card");
    expect(itemCard).toContain("PublishHubItemThumb");
    expect(itemModel).toContain("PublishHubItem");
    expect(l5).toContain("itemCard");
    expect(pageMain).toContain("PublishHubTripRailSection");
    expect(pageMain).toContain("PublishHubGovernanceRailSection");
    expect(pageMain).toContain("PublishHubGuideRailSection");
    expect(pageMain).not.toContain("PublishHubCommunityRailSection");
    expect(pageMain).toContain("PublishHubSummaryStrip");
    expect(pageMain).toContain("usePublishHubTripOrders");
    expect(pageMain).toContain("usePublishHubGovernanceRail");
    expect(pageMain).toContain("usePublishHubGuideRail");
    expect(pageMain).not.toContain("usePublishHubCommunityPreview");
    expect(pageMain).toContain("usePublishHubServerSummary");
    expect(pageMain).toContain("publishHubVisibleContentRails");
  });

  it("header nav wires publish hub before orders", () => {
    expect(navModel).toContain("PUBLISH_HUB_PATH");
    expect(navModel).toContain("header_userMenu_publish_hub");
    expect(navModel.indexOf("header_userMenu_publish_hub")).toBeLessThan(
      navModel.indexOf("header_myOrders"),
    );
  });

  it("Phase A sprint marker and active rails", () => {
    expect(PUBLISH_HUB_PHASE_A_SPRINT_MARKER).toBe("publish-hub-phase-a-20260612");
    expect(PUBLISH_HUB_PHASE_A_ACTIVE_RAILS).toEqual([
      "trip",
      "guide",
      "merchant",
      "acquisition",
      "governance",
    ]);
    expect(PUBLISH_HUB_PHASE_A_ITEMS.some((i) => i.id === "PH-A-1" && i.status === "active")).toBe(true);
    expect(PUBLISH_HUB_PHASE_A_ITEMS.some((i) => i.id === "PH-A-2" && i.status === "active")).toBe(true);
    expect(PUBLISH_HUB_PHASE_A_ITEMS.some((i) => i.id === "PH-A-6" && i.status === "active")).toBe(true);
    expect(PUBLISH_HUB_PHASE_A_ITEMS.some((i) => i.id === "PH-A-8" && i.status === "active")).toBe(true);
    expect(PUBLISH_HUB_HEADER_NAV.publishHubHref).toBe(PUBLISH_HUB_PATH);
    expect(PUBLISH_HUB_HEADER_NAV.postsLabelKey).toBe("header_userMenu_my_posts");
  });
});
