import { describe, expect, it } from "vitest";



import {

  TRAVELTRUST_ANNOUNCEMENT_KIND_DEFAULT_CTA,



  validateTraveltrustAnnouncementContract,



  validateTraveltrustRoadmapMilestoneContract,



} from "./traveltrustAnnouncementSchema";



import {



  TRAVELTRUST_ANNOUNCEMENTS_PATH,



  TRAVELTRUST_ANNOUNCEMENT_OPS_RULES,



  TRAVELTRUST_NETWORK_ANNOUNCEMENTS,



  TRAVELTRUST_DEPLOY_PHASE1_ACTIVE_ISO,
  TRAVELTRUST_PLATFORM_LAUNCH_ISO,



  TRAVELTRUST_PULSE_MAX_VISIBLE,



  assertTraveltrustAnnouncementsSchemaContract,



  isTraveltrustAnnouncementActive,



  listTraveltrustAnnouncementsByLane,
  listTraveltrustPulseProductAnnouncements,



  resolveTraveltrustAnnouncementCtaKind,



  resolveTraveltrustAnnouncementDisplayDate,



  resolveTraveltrustAnnouncementExpiresAt,



  resolveTraveltrustAnnouncementModalCtaLabelKey,



  resolveTraveltrustAnnouncementPreviewStatusLabelKey,



  resolveTraveltrustAnnouncementRowCtaLabelKey,



  resolveTraveltrustPulseAnnouncementId,



  traveltrustAnnouncementPageHref,



} from "./traveltrustNetworkAnnouncements";



import {



  assertTraveltrustRoadmap2026SchemaContract,
  TRAVELTRUST_ROADMAP_2026,
  resolveTraveltrustRoadmapTargetLabel,
} from "./traveltrustRoadmap2026";







describe("traveltrustAnnouncementSchema", () => {



  it("enforces conditional date fields", () => {



    expect(



      validateTraveltrustAnnouncementContract({



        id: "x",



        kind: "product",



        contentTier: "live",



        messageKey: "k",



      }),



    ).toContain("x: live requires effectiveAt");







    expect(



      validateTraveltrustAnnouncementContract({



        id: "y",



        kind: "product",



        contentTier: "upcoming",



        messageKey: "k",



        effectiveAt: "2026-01-01",



      }),



    ).toContain("y: upcoming forbids effectiveAt");







    expect(



      validateTraveltrustRoadmapMilestoneContract({



        id: "z",



        kind: "product",



        contentTier: "roadmap",



        messageKey: "k",



        releaseAt: "2026-01-01",



      }),



    ).toContain("z: roadmap forbids releaseAt");



  });







  it("default CTA follows kind", () => {



    expect(TRAVELTRUST_ANNOUNCEMENT_KIND_DEFAULT_CTA.product).toBe("learn_more");



    expect(TRAVELTRUST_ANNOUNCEMENT_KIND_DEFAULT_CTA.community).toBe("vote_now");



    expect(TRAVELTRUST_ANNOUNCEMENT_KIND_DEFAULT_CTA.campaign).toBe("join_now");



  });



});







describe("traveltrustNetworkAnnouncements", () => {



  it("static catalog passes schema contract", () => {



    expect(assertTraveltrustAnnouncementsSchemaContract()).toEqual([]);



    expect(assertTraveltrustRoadmap2026SchemaContract()).toEqual([]);



  });







  it("lists product lane on home pulse (not protocol_status)", () => {
    const sorted = listTraveltrustPulseProductAnnouncements();
    expect(sorted.length).toBeLessThanOrEqual(TRAVELTRUST_PULSE_MAX_VISIBLE);
    expect(sorted.every((a) => a.lane === "product")).toBe(true);
    expect(sorted[0]?.id).toBe("product-planned-launch");
    expect(sorted.some((a) => a.id === "phase3-entry-mainnet-prep")).toBe(false);
  });

  it("keeps protocol_status in separate lane", () => {
    const protocol = listTraveltrustAnnouncementsByLane("protocol_status");
    expect(protocol.map((a) => a.id)).toEqual([
      "phase3-entry-mainnet-prep",
      "product-deploy-phase3",
      "product-deploy-phase2",
      "product-deploy-phase1",
    ]);
  });







  it("uses only frozen kind and contentTier dimensions", () => {

    expect(TRAVELTRUST_ANNOUNCEMENT_OPS_RULES.frozen).toBe(true);

    const kinds = new Set(TRAVELTRUST_NETWORK_ANNOUNCEMENTS.map((a) => a.kind));

    for (const kind of kinds) {

      expect(TRAVELTRUST_ANNOUNCEMENT_OPS_RULES.kinds).toContain(kind);

    }

    for (const item of TRAVELTRUST_NETWORK_ANNOUNCEMENTS) {

      expect(TRAVELTRUST_ANNOUNCEMENT_OPS_RULES.contentTiers).toContain(item.contentTier);

    }

  });







  it("traveltrustAnnouncementPageHref lands on announcements archive", () => {



    expect(traveltrustAnnouncementPageHref()).toBe(TRAVELTRUST_ANNOUNCEMENTS_PATH);



  });







  it("catalog lanes: product upcoming + protocol live archive", () => {
    const product = TRAVELTRUST_NETWORK_ANNOUNCEMENTS.filter((a) => a.lane === "product");
    const protocol = TRAVELTRUST_NETWORK_ANNOUNCEMENTS.filter((a) => a.lane === "protocol_status");
    expect(product.length).toBe(4);
    expect(protocol.length).toBe(4);
    for (const item of product) {
      if (item.id === "product-security-disclosure") {
        expect(item.contentTier).toBe("live");
      } else {
        expect(item.contentTier).toBe("upcoming");
        expect(item.releaseAt).toBeDefined();
      }
      expect(validateTraveltrustAnnouncementContract(item)).toEqual([]);
    }
    for (const item of protocol) {
      expect(item.contentTier).toBe("live");
      expect(item.effectiveAt).toBeDefined();
      expect(validateTraveltrustAnnouncementContract(item)).toEqual([]);
    }
    expect(TRAVELTRUST_NETWORK_ANNOUNCEMENTS).toHaveLength(10);
  });







  it("china is roadmap-only (not duplicated in pulse)", () => {



    expect(TRAVELTRUST_NETWORK_ANNOUNCEMENTS.some((a) => a.id === "product-china")).toBe(false);



    const china = TRAVELTRUST_ROADMAP_2026.find((m) => m.id === "milestone-china-guides")!;

    expect(china.targetAt).toBeUndefined();
    expect(china.targetLabelKey).toBe("traveltrust_roadmap_target_2026_milestone");

    const t = (key: string) =>
      ({
        traveltrust_roadmap_target_tbd: "Target · TBA",
        traveltrust_roadmap_target_2026_milestone: "2026 milestone",
      })[key] ?? key;

    expect(resolveTraveltrustRoadmapTargetLabel(china, t)).toBe("2026 milestone");



  });







  it("phased deploy CTAs point to real routes", () => {

    const phase1 = TRAVELTRUST_NETWORK_ANNOUNCEMENTS.find((a) => a.id === "product-deploy-phase1")!;

    expect(phase1.ctaHref).toBe("/traveltrust#liquidity");



    const phase2 = TRAVELTRUST_NETWORK_ANNOUNCEMENTS.find((a) => a.id === "product-deploy-phase2")!;

    expect(phase2.ctaHref).toBe("/governance/proposals");

    expect(phase2.kind).toBe("product");

    expect(resolveTraveltrustAnnouncementCtaKind(phase2)).toBe("learn_more");

    expect(resolveTraveltrustAnnouncementRowCtaLabelKey(phase2)).toBe("traveltrust_pulse_view_detail");

  });







  it("live Sepolia modal uses ACTIVE status label (not preview)", () => {
    const phase1 = TRAVELTRUST_NETWORK_ANNOUNCEMENTS.find((a) => a.id === "product-deploy-phase1")!;
    const phase2 = TRAVELTRUST_NETWORK_ANNOUNCEMENTS.find((a) => a.id === "product-deploy-phase2")!;
    expect(resolveTraveltrustAnnouncementModalCtaLabelKey(phase1)).toBe(
      "traveltrust_announcements_detail_cta_subscribe_ttg",
    );
    expect(resolveTraveltrustAnnouncementModalCtaLabelKey(phase2)).toBe(
      "traveltrust_announcements_detail_cta_view_proposals",
    );
    expect(resolveTraveltrustAnnouncementPreviewStatusLabelKey(phase1)).toBe(
      "traveltrust_announcements_detail_status_sepolia_active",
    );
  });

  it("legacy pulse ids alias to phase1 for deep links", () => {
    expect(resolveTraveltrustPulseAnnouncementId("trust-escrow-core")).toBe("product-deploy-phase1");

    expect(traveltrustAnnouncementPageHref("product-intro")).toBe(
      `${TRAVELTRUST_ANNOUNCEMENTS_PATH}#product-deploy-phase1`,
    );
  });







  it("phase announcements stay active before expiresAt", () => {

    expect(isTraveltrustAnnouncementActive(TRAVELTRUST_NETWORK_ANNOUNCEMENTS[0]!)).toBe(true);

  });







  it("product upcoming uses explicit expiresAt", () => {

    const phase2 = TRAVELTRUST_NETWORK_ANNOUNCEMENTS.find((a) => a.id === "product-deploy-phase2")!;

    expect(resolveTraveltrustAnnouncementExpiresAt(phase2)).toBe("2026-12-31");

  });







  it("roadmap lists long-term milestones only (no deploy phases)", () => {

    const milestones = [...TRAVELTRUST_ROADMAP_2026].sort((a, b) => a.sortOrder - b.sortOrder);

    expect(milestones).toHaveLength(2);

    expect(milestones.map((m) => m.id)).toEqual([

      "milestone-app-launch",

      "milestone-china-guides",

    ]);

    expect(milestones.some((m) => m.id.startsWith("milestone-deploy-phase"))).toBe(false);

  });



});



