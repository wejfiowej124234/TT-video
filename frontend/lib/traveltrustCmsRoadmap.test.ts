import { describe, expect, it } from "vitest";
import {
  mapCmsRoadmapMilestone,
  resolveRoadmapMilestoneTargetLabel,
  resolveRoadmapSectionCopy,
} from "./traveltrustCmsRoadmap";
import { TRAVELTRUST_PRODUCT_ROADMAP_ANCHOR } from "./cmsRoadmapTypes";

describe("traveltrustCmsRoadmap", () => {
  it("maps CMS milestone row with ops_status", () => {
    const mapped = mapCmsRoadmapMilestone({
      id: "1",
      slug: "milestone-app-launch",
      kind: "product",
      content_tier: "roadmap",
      pinned: false,
      sort_order: 10,
      title_zh: "App",
      title_en: "App",
      summary_zh: "benefit zh",
      summary_en: "benefit en",
      body_zh: null,
      body_en: null,
      target_at: null,
      cta_kind: "learn_more",
      cta_href: "/traveltrust",
      network_scope: "none",
      message_key: null,
      ops_status: "planned",
      published_at: null,
      updated_at: "2026-07-09T00:00:00Z",
    });
    expect(mapped.id).toBe("milestone-app-launch");
    expect(mapped.status).toBe("planned");
    expect(mapped.cmsCopy?.titleZh).toBe("App");
  });

  it("uses period label for milestone target when no target_at", () => {
    const item = mapCmsRoadmapMilestone({
      id: "1",
      slug: "x",
      kind: "product",
      content_tier: "roadmap",
      pinned: false,
      sort_order: 1,
      title_zh: "t",
      title_en: "t",
      summary_zh: "",
      summary_en: "",
      body_zh: null,
      body_en: null,
      target_at: null,
      cta_kind: null,
      cta_href: null,
      network_scope: "none",
      message_key: null,
      ops_status: "planned",
      published_at: null,
      updated_at: "2026-07-09T00:00:00Z",
    });
    const t = (key: string) =>
      ({ traveltrust_roadmap_milestone_suffix: "里程碑" })[key] ?? key;
    expect(resolveRoadmapMilestoneTargetLabel(item, "2027", t)).toBe("2027 里程碑");
  });

  it("falls back to locale section copy when CMS section null", () => {
    const copy = resolveRoadmapSectionCopy(null, true, (k) =>
      k === "traveltrust_roadmap_kicker" ? "产品路线图" : k,
    );
    expect(copy.anchorId).toBe(TRAVELTRUST_PRODUCT_ROADMAP_ANCHOR);
    expect(copy.kicker).toBe("产品路线图");
  });
});
