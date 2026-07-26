/**
 * Batch-11 W02 · HU-324 / HU-325 / HU-332 contract anchors (① local).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { buildAdminHomeDomainHealth } from "@/lib/admin/adminHomeDomainHealth";
import { adminHomeHonestMetricDisplay } from "@/lib/admin/adminHomeHonestMetricDisplay";
import {
  ADMIN_DOMAIN_HEALTH_UNKNOWN_CARD_CLASS,
  ADMIN_TEXT_BODY_CLASS,
  ADMIN_TEXT_FOOTNOTE_CLASS,
} from "@/lib/adminUi";

const root = join(__dirname, "..", "..");

describe("Batch-11 W02 workbench (HU-324/325/332)", () => {
  const t = (k: string) => k;

  it("HU-324 · honest metric display never returns bare ellipsis", () => {
    // HU-440 · loading/empty align to empty-state dict keys
    expect(adminHomeHonestMetricDisplay(t, { loading: true, value: null })).toBe(
      "admin_home_empty_state_loading",
    );
    expect(adminHomeHonestMetricDisplay(t, { loading: false, value: null })).toBe(
      "admin_home_empty_state_empty",
    );
  });

  it("HU-325 · content/official/growth expose CTA labels + deep hrefs", () => {
    const items = buildAdminHomeDomainHealth({
      counts: { provider: 0, guide: 0, steward: 0, approvals: 0, reports: 0 },
      channels: {
        provider: { count: null, permissionDenied: false, errorKind: null },
        guide: { count: null, permissionDenied: false, errorKind: null },
        steward: { count: null, permissionDenied: false, errorKind: null },
        approvals: { count: null, permissionDenied: false, errorKind: null },
        reports: { count: null, permissionDenied: false, errorKind: null },
      },
      kpi: { orders: 0, disputes: 0, guides: null },
      inboxLoading: false,
      kpiLoading: false,
      hasPermission: () => true,
      permissionsLoaded: true,
      t,
    });
    expect(items.find((i) => i.id === "content")).toMatchObject({
      href: "/admin/content",
      countLabel: "admin_home_domain_health_cta_content",
      tone: "unknown",
    });
    expect(items.find((i) => i.id === "official")).toMatchObject({
      href: "/admin/official",
      countLabel: "admin_home_domain_health_cta_official",
    });
    expect(items.find((i) => i.id === "growth")).toMatchObject({
      href: "/admin/growth",
      countLabel: "admin_home_domain_health_cta_growth",
    });
    expect(items.find((i) => i.id === "community")?.href).toBe("/admin/community/reports");
  });

  it("HU-332 · DomainHealthStrip uses ADMIN_TEXT_* + dark-shell unknown + hub footnote", () => {
    const src = readFileSync(
      join(root, "components/admin/AdminHomeDomainHealthStrip.tsx"),
      "utf8",
    );
    expect(src).toContain("ADMIN_TEXT_BODY_CLASS");
    expect(src).toContain("ADMIN_TEXT_FOOTNOTE_CLASS");
    expect(src).toContain("data-tt-admin-domain-health-hub-footnote");
    expect(src).not.toMatch(/text-ink-900/);
    expect(ADMIN_DOMAIN_HEALTH_UNKNOWN_CARD_CLASS).toContain("slate-950");
    expect(ADMIN_TEXT_BODY_CLASS.length).toBeGreaterThan(0);
    expect(ADMIN_TEXT_FOOTNOTE_CLASS).toContain("slate-300");
  });

  it("HU-324 · SystemOverview wires honest metric helper + roles deep link", () => {
    const src = readFileSync(
      join(root, "components/admin/AdminHomeSystemOverview.tsx"),
      "utf8",
    );
    expect(src).toContain("adminHomeHonestMetricDisplay");
    expect(src).toContain("admin_home_system_overview_chain_loading");
    expect(src).toContain('data-tt-admin-home-roles-more="1"');
    expect(src).not.toMatch(/return "…"/);
  });
});
