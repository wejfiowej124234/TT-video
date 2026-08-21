import { describe, expect, it } from "vitest";
import {
  resolveTraveltrustAnnouncementBenefitBullets,
  resolveTraveltrustAnnouncementDetailContent,
  resolveTraveltrustAnnouncementHighlight,
} from "./traveltrustAnnouncementDetailContent";
import { TRAVELTRUST_NETWORK_ANNOUNCEMENTS } from "./traveltrustNetworkAnnouncements";

describe("traveltrustAnnouncementDetailContent", () => {
  it("web3 core phase1 keeps two related links: params first, then TTG liquidity", () => {
    const item = TRAVELTRUST_NETWORK_ANNOUNCEMENTS.find((a) => a.id === "product-deploy-phase1")!;
    const detail = resolveTraveltrustAnnouncementDetailContent(item);

    expect(detail.variant).toBe("generic");
    expect(detail.steps).toHaveLength(3);
    expect(detail.stepsSectionLabelKey).toBe("traveltrust_announcements_detail_phase_opens");
    expect(detail.related).toHaveLength(2);
    expect(detail.related.map((r) => r.href)).toEqual(["/governance/params", "/traveltrust#liquidity"]);
    expect(detail.related.some((r) => r.href === "/trust")).toBe(false);
    expect(detail.related.some((r) => r.href === "/travel")).toBe(false);
    expect(detail.related.some((r) => r.href === "/pay")).toBe(false);
    expect(item.ctaHref).toBe("/traveltrust#liquidity");
  });

  it("legacy trust and product intro ids resolve to phase1 detail body", () => {
    const trust = {
      ...TRAVELTRUST_NETWORK_ANNOUNCEMENTS[0]!,
      id: "trust-escrow-core",
    };
    const intro = {
      ...TRAVELTRUST_NETWORK_ANNOUNCEMENTS[0]!,
      id: "product-intro",
    };
    expect(resolveTraveltrustAnnouncementDetailContent(trust).related.map((r) => r.href)).toEqual([
      "/governance/params",
      "/traveltrust#liquidity",
    ]);
    expect(resolveTraveltrustAnnouncementDetailContent(intro).related.map((r) => r.href)).toEqual([
      "/governance/params",
      "/traveltrust#liquidity",
    ]);
  });

  it("phase3 entry surfaces params only", () => {
    const item = TRAVELTRUST_NETWORK_ANNOUNCEMENTS.find((a) => a.id === "phase3-entry-mainnet-prep")!;
    const detail = resolveTraveltrustAnnouncementDetailContent(item);
    expect(detail.related).toHaveLength(1);
    expect(detail.related[0]?.href).toBe("/governance/params");
  });

  it("phase2 orders proposals before params", () => {
    const item = TRAVELTRUST_NETWORK_ANNOUNCEMENTS.find((a) => a.id === "product-deploy-phase2")!;
    const detail = resolveTraveltrustAnnouncementDetailContent(item);
    expect(detail.stepsSectionLabelKey).toBe("traveltrust_announcements_detail_phase_upgrades");
    expect(detail.related.map((r) => r.href)).toEqual(["/governance/proposals", "/governance/params"]);
  });

  it("resolves benefit bullets when keys translate", () => {
    const item = TRAVELTRUST_NETWORK_ANNOUNCEMENTS.find((a) => a.id === "product-deploy-phase1")!;
    const detail = resolveTraveltrustAnnouncementDetailContent(item);
    const t = (key: string) => (key.endsWith("_benefit_b1") ? "Bullet one" : key);
    expect(resolveTraveltrustAnnouncementBenefitBullets(detail, t)).toEqual(["Bullet one"]);
  });

  it("resolves highlight text when key exists", () => {
    const item = TRAVELTRUST_NETWORK_ANNOUNCEMENTS.find((a) => a.id === "product-deploy-phase1")!;
    const detail = resolveTraveltrustAnnouncementDetailContent(item);
    const t = (key: string) => (key === detail.highlightKey ? "Sepolia ACTIVE" : key);
    expect(resolveTraveltrustAnnouncementHighlight(item, detail, t)).toBe("Sepolia ACTIVE");
  });
});
