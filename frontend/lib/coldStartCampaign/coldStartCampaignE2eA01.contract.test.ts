import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "../../..");

function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

describe("E2E-A-01 cold start campaign consumer contract", () => {
  it("public RO route registered in official router", () => {
    expect(read("crates/api/src/routes/official/mod.rs")).toContain(
      "/api/v1/official/cold-start/surfaces/:surface",
    );
  });

  it("consumer db module resolves deployed campaigns", () => {
    const src = read("crates/api/src/db/ops_cold_start_campaigns_consumer.rs");
    expect(src).toContain("get_deployed_cold_start_campaign_for_surface");
    expect(src).toContain("DEP_DEPLOYED");
    expect(src).toContain("ITEM_ACTIVE");
  });

  it("FE client + hook + three surface integrations", () => {
    expect(read("frontend/lib/coldStartCampaign/client.ts")).toContain(
      "/api/v1/official/cold-start/surfaces/",
    );
    expect(read("frontend/components/coldStartCampaign/ColdStartCampaignSurfaceSection.tsx")).toContain(
      "data-tt-cold-start-surface",
    );
    expect(read("frontend/components/coldStartCampaign/ColdStartCampaignSurfaceSection.tsx")).toContain(
      "ConsumerSurfaceStatePanel",
    );
    expect(read("frontend/components/consumer/ConsumerSurfaceStatePanel.tsx")).toContain(
      "data-tt-cold-start-loading",
    );
    expect(read("frontend/components/consumer/ConsumerSurfaceStatePanel.tsx")).toContain(
      "data-tt-cold-start-empty",
    );
    expect(read("frontend/app/plan/page.tsx")).toContain("ColdStartHomeHeroHighlights");
    expect(read("frontend/app/market/MarketPageClient.tsx")).toContain("COLD_START_SURFACE_MARKET_FEED");
    expect(read("frontend/components/community/CommunityFeedMain.tsx")).toContain(
      "COLD_START_SURFACE_COMMUNITY_FEED",
    );
  });

  it("routes.ts exposes officialColdStartSurface", () => {
    expect(read("frontend/lib/api/routes.ts")).toContain("officialColdStartSurface");
  });

  it("home consumer hero hides probe campaigns and renders highlight cards", () => {
    expect(read("frontend/app/plan/page.tsx")).toContain("ColdStartHomeHeroHighlights");
    expect(read("frontend/components/coldStartCampaign/ColdStartHomeHeroHighlights.tsx")).toContain(
      "data-tt-cold-start-consumer",
    );
    expect(read("frontend/lib/coldStartCampaign/coldStartConsumerPresentation.ts")).toContain(
      "isInternalConsumerText",
    );
    expect(read("frontend/components/coldStartCampaign/ColdStartOfficialHighlightCard.tsx")).toContain(
      "data-tt-cold-start-consumer-cta",
    );
  });
});
