import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  TT_MARKETING_DARK_ROUTE_DESKTOP_HEADER_COMMUNITY_PREMIUM,
  TT_MARKETING_DARK_ROUTE_TAB_ACTIVE_COMMUNITY_PREMIUM,
  TT_MARKETING_DARK_ROUTE_TAB_RAIL_COMMUNITY_PREMIUM,
  TT_MARKETING_HEADER_BAR_COMMUNITY_PREMIUM,
} from "@/lib/marketingUi";

describe("community shell theme V1 (contract)", () => {
  it("CommunityRouteShellInner uses premium community header tokens", () => {
    const src = readFileSync(join(import.meta.dirname, "CommunityRouteShellInner.tsx"), "utf8");
    expect(src).toContain("TT_MARKETING_DARK_ROUTE_DESKTOP_HEADER_COMMUNITY_PREMIUM");
    expect(src).toContain("TT_MARKETING_DARK_ROUTE_HEADER_LINK_PRIMARY");
  });

  it("community premium desktop L1 tab bar does not sticky-overlay feed body", () => {
    expect(TT_MARKETING_DARK_ROUTE_DESKTOP_HEADER_COMMUNITY_PREMIUM).toContain("relative z-[240]");
    expect(TT_MARKETING_DARK_ROUTE_DESKTOP_HEADER_COMMUNITY_PREMIUM).toContain("overflow-visible");
    expect(TT_MARKETING_DARK_ROUTE_DESKTOP_HEADER_COMMUNITY_PREMIUM).not.toContain("sticky");
  });

  it("CommunitySupportMenu portals dropdown panel to body", () => {
    const src = readFileSync(join(import.meta.dirname, "CommunitySupportMenu.tsx"), "utf8");
    expect(src).toContain("createPortal");
    expect(src).toContain("community-support-menu-panel");
    expect(src).toContain("supportMenuPanel");
    expect(src).toContain("supportMenuSheet");
  });

  it("community top chrome does not stack two solid #0a0a0a header bars", () => {
    const l0 = TT_MARKETING_HEADER_BAR_COMMUNITY_PREMIUM;
    const l1 = TT_MARKETING_DARK_ROUTE_DESKTOP_HEADER_COMMUNITY_PREMIUM;
    const rail = TT_MARKETING_DARK_ROUTE_TAB_RAIL_COMMUNITY_PREMIUM;
    expect(l0).toContain("border-b-0");
    expect(l0).toContain("bg-[#0a0a0a]");
    expect(l1).toContain("bg-transparent");
    expect(l1).not.toContain("bg-[#0a0a0a]");
    expect(l1).toContain("border-b");
    expect(rail).toContain("bg-transparent");
  });

  it("marketingUi exports TT_COMMUNITY_PAGE_L5 for sub-route chrome", () => {
    const src = readFileSync(join(import.meta.dirname, "../../lib/marketingUi.ts"), "utf8");
    expect(src).toContain("TT_COMMUNITY_PAGE_L5");
    expect(src).toContain("pageTitle:");
  });

  it("communityRouteShellConstants tabs map to premium matte active", () => {
    const src = readFileSync(join(import.meta.dirname, "communityRouteShellConstants.ts"), "utf8");
    expect(src).toContain("TT_MARKETING_DARK_ROUTE_TAB_ACTIVE_COMMUNITY_PREMIUM");
    expect(src).toContain("哑光");
  });

  it("shell tab active avoids Action gradient fill block", () => {
    expect(TT_MARKETING_DARK_ROUTE_TAB_ACTIVE_COMMUNITY_PREMIUM).toContain("bg-ref-sun/10");
    expect(TT_MARKETING_DARK_ROUTE_TAB_ACTIVE_COMMUNITY_PREMIUM).not.toContain("gradient");
  });

  it("Phase ① freeze marker on CommunityRouteShell (2026-06-03)", () => {
    const shell = readFileSync(join(import.meta.dirname, "CommunityRouteShell.tsx"), "utf8");
    expect(shell).toContain('data-tt-community-phase1-frozen="1"');
    const activity = readFileSync(
      join(import.meta.dirname, "../../app/community/activity/page.tsx"),
      "utf8",
    );
    expect(activity).toContain("community_more_coming");
    expect(activity).toContain("getMeActivity");
  });
});
