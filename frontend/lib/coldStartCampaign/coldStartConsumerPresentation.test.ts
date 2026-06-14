import { describe, expect, it } from "vitest";

import {
  buildConsumerHighlightCard,
  filterConsumerHighlightCards,
  isInternalConsumerText,
  resolveConsumerHomeHeroHighlights,
} from "./coldStartConsumerPresentation";
import type { ColdStartCampaignItem, ColdStartCampaignPayload } from "./types";

const t = (key: string, params?: Record<string, string>) => {
  if (params) {
    return `${key}:${JSON.stringify(params)}`;
  }
  return key;
};

const validGuideItem: ColdStartCampaignItem = {
  id: "item-guide-1",
  item_type: "official_account",
  sort_order: 0,
  payload: {},
  resolved: {
    id: "acc-1",
    display_label: "小林 · 东京在地向导",
    account_kind: "guide",
    linked_guide_id: "guide-tokyo-1",
  },
};

const validRouteItem: ColdStartCampaignItem = {
  id: "item-route-1",
  item_type: "itinerary_template",
  sort_order: 1,
  payload: {},
  resolved: {
    id: "tpl-1",
    title: "京都三日慢游",
    country_iso: "JP",
    cover_image_url: "https://images.unsplash.com/photo-example",
  },
};

const probeCampaign: ColdStartCampaignPayload = {
  id: "camp-probe",
  name: "L5-E2-1710000000",
  surfaces: ["home_hero"],
  deployed_at: "2026-06-08T00:00:00.000Z",
  items: [validGuideItem],
};

const consumerCampaign: ColdStartCampaignPayload = {
  id: "camp-consumer",
  name: "2026 春季官方精选",
  surfaces: ["home_hero"],
  deployed_at: "2026-06-08T00:00:00.000Z",
  items: [validGuideItem, validRouteItem],
};

describe("coldStartConsumerPresentation", () => {
  it("flags internal probe and ops terminology", () => {
    expect(isInternalConsumerText("L5-E2-1710000000")).toBe(true);
    expect(isInternalConsumerText("Probe smoke campaign")).toBe(true);
    expect(isInternalConsumerText("ops_cold_start_deploy")).toBe(true);
    expect(isInternalConsumerText("home_hero sprint seed")).toBe(true);
    expect(isInternalConsumerText("2026 春季官方精选")).toBe(false);
    expect(isInternalConsumerText("京都三日慢游")).toBe(false);
  });

  it("builds consumer cards with href, cover, and copy keys", () => {
    const card = buildConsumerHighlightCard(validRouteItem, t);
    expect(card).not.toBeNull();
    expect(card?.href).toContain("/market?view=split&cold_start_template=");
    expect(card?.coverUrl).toContain("unsplash");
    expect(card?.title).toBe("京都三日慢游");
    expect(card?.valueLine).toBe("cold_start_consumer_value_official_route");
    expect(card?.ctaLabel).toBe("cold_start_consumer_cta_official_route");
  });

  it("drops items without consumer-safe titles or links", () => {
    const broken: ColdStartCampaignItem = {
      ...validGuideItem,
      id: "broken",
      resolved: { ...validGuideItem.resolved, display_label: "L5-D3 probe", linked_guide_id: null },
    };
    expect(buildConsumerHighlightCard(broken, t)).toBeNull();
  });

  it("hides home hero when campaign name is internal", () => {
    const result = resolveConsumerHomeHeroHighlights(probeCampaign, probeCampaign.items, t);
    expect(result.visible).toBe(false);
    expect(result.cards).toHaveLength(0);
  });

  it("shows home hero when campaign and items are consumer-ready", () => {
    const result = resolveConsumerHomeHeroHighlights(consumerCampaign, consumerCampaign.items, t);
    expect(result.visible).toBe(true);
    expect(filterConsumerHighlightCards(consumerCampaign.items, t)).toHaveLength(2);
  });
});
