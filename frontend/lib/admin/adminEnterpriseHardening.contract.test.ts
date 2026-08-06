import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  ADMIN_ENTERPRISE_HARDENING_MARKERS,
  ADMIN_ENTERPRISE_LIST_VIRTUAL_THRESHOLD,
  ADMIN_GUIDES_STATUS_SELECT_OPTIONS,
  adminEnterpriseContentStatusContrastTone,
  shouldVirtualizeAdminEnterpriseList,
} from "./adminEnterpriseHardeningContract";

const __dir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = join(__dir, "..", "..");

function read(rel: string): string {
  return readFileSync(join(frontendRoot, rel), "utf8");
}

/** ① V65 Batch3 Cut B · Enterprise Admin Hardening contract. */
describe("adminEnterpriseHardening contract (① Cut B)", () => {
  it("exports stable staging-smoke markers", () => {
    expect(ADMIN_ENTERPRISE_HARDENING_MARKERS.root).toBe("data-tt-admin-enterprise-hardening");
    expect(ADMIN_ENTERPRISE_HARDENING_MARKERS.lifecycleBadge).toBe(
      "data-tt-admin-enterprise-lifecycle-badge",
    );
    expect(ADMIN_ENTERPRISE_HARDENING_MARKERS.hubDataSourceStrip).toBe(
      "data-tt-admin-enterprise-hub-data-source",
    );
    expect(ADMIN_ENTERPRISE_HARDENING_MARKERS.tipHonestyStrip).toBe(
      "data-tt-admin-enterprise-tip-honesty",
    );
    expect(ADMIN_ENTERPRISE_HARDENING_MARKERS.contentStatusContrast).toBe(
      "data-tt-admin-enterprise-content-status-contrast",
    );
    expect(ADMIN_ENTERPRISE_HARDENING_MARKERS.guidesTableChrome).toBe(
      "data-tt-admin-enterprise-guides-table-chrome",
    );
    expect(ADMIN_ENTERPRISE_HARDENING_MARKERS.guidesStatusSelect).toBe(
      "data-tt-admin-enterprise-guides-status-select",
    );
    expect(ADMIN_ENTERPRISE_HARDENING_MARKERS.guidesFilterBar).toBe(
      "data-tt-admin-enterprise-guides-filter-bar",
    );
    expect(ADMIN_ENTERPRISE_HARDENING_MARKERS.guidesTableNowrap).toBe(
      "data-tt-admin-enterprise-guides-table-nowrap",
    );
    expect(ADMIN_ENTERPRISE_HARDENING_MARKERS.listVirtual).toBe(
      "data-tt-admin-enterprise-list-virtual",
    );
    expect(ADMIN_ENTERPRISE_HARDENING_MARKERS.ordersReadonlyHonesty).toBe(
      "data-tt-admin-enterprise-orders-readonly-honesty",
    );
    expect(ADMIN_ENTERPRISE_HARDENING_MARKERS.contentSurfaceHonesty).toBe(
      "data-tt-admin-enterprise-content-surface-honesty",
    );
    expect(ADMIN_ENTERPRISE_HARDENING_MARKERS.contentDepthHonesty).toBe(
      "data-tt-admin-enterprise-content-depth-honesty",
    );
  });

  it("virtualizes at threshold 32 (R037/R054)", () => {
    expect(ADMIN_ENTERPRISE_LIST_VIRTUAL_THRESHOLD).toBe(32);
    expect(shouldVirtualizeAdminEnterpriseList(31)).toBe(false);
    expect(shouldVirtualizeAdminEnterpriseList(32)).toBe(true);
  });

  it("guides status select options are closed enum (R035)", () => {
    expect([...ADMIN_GUIDES_STATUS_SELECT_OPTIONS]).toEqual([
      "",
      "active",
      "suspended",
      "pending_review",
      "rejected",
    ]);
  });

  it("content status contrast tones map published/in_flight/archived (R033)", () => {
    expect(adminEnterpriseContentStatusContrastTone("published")).toBe("published");
    expect(adminEnterpriseContentStatusContrastTone("draft")).toBe("in_flight");
    expect(adminEnterpriseContentStatusContrastTone("archived")).toBe("archived");
    expect(adminEnterpriseContentStatusContrastTone("")).toBe("neutral");
  });

  it("HonestyChrome + virtualizer wire Cut B marker keys", () => {
    const chrome = read("components/admin/AdminEnterpriseHonestyChrome.tsx");
    const virt = read("components/admin/AdminEnterpriseListVirtual.tsx");
    expect(chrome).toContain("ADMIN_ENTERPRISE_HARDENING_MARKERS");
    expect(chrome).toContain("M.lifecycleBadge");
    expect(chrome).toContain("M.hubDataSourceStrip");
    expect(chrome).toContain("M.tipHonestyStrip");
    expect(chrome).toContain("M.contentSurfaceHonesty");
    expect(chrome).toContain("M.contentDepthHonesty");
    expect(chrome).toContain("M.ordersReadonlyHonesty");
    expect(chrome).toContain("M.root");
    expect(virt).toContain("M.listVirtual");
    expect(virt).toContain("M.listVirtualCount");
  });

  it("Content shell uses high-contrast status badge (R033)", () => {
    const shell = read("components/admin/content/AdminContentPageShell.tsx");
    expect(shell).toContain("contentStatusContrast");
    expect(shell).toContain("ADMIN_ENTERPRISE_CONTENT_STATUS_CONTRAST_CLASS");
  });

  it("Content hub wires truth + surface honesty (R015/R043/R049/R051/R056)", () => {
    const hub = read("app/admin/content/AdminContentHubMain.tsx");
    expect(hub).toContain("AdminEnterpriseLifecycleBadge");
    expect(hub).toContain("AdminEnterpriseHubDataSourceStrip");
    expect(hub).toContain("AdminEnterpriseTipHonestyStrip");
    expect(hub).toContain("AdminEnterpriseContentSurfaceHonesty");
    expect(hub).toContain('tone="PARTIAL"');
    expect(hub).toContain('kind="mixed_declared"');
  });

  it("Growth + Official hubs wire lifecycle / data-source / tip (R049/R051/R056)", () => {
    const growth = read("app/admin/growth/AdminGrowthHubMain.tsx");
    const official = read("app/admin/official/AdminOfficialOpsHubDashboard.tsx");
    for (const src of [growth, official]) {
      expect(src).toContain("AdminEnterpriseLifecycleBadge");
      expect(src).toContain("AdminEnterpriseHubDataSourceStrip");
      expect(src).toContain("AdminEnterpriseTipHonestyStrip");
    }
  });

  it("Guides page wires table chrome / status select / virtual dual-path (R034/R035/R037/R054)", () => {
    const guides = read("app/admin/guides/AdminGuidesPageMain.tsx");
    expect(guides).toContain("guidesTableChrome");
    expect(guides).toContain("guidesStatusSelect");
    expect(guides).toContain("guidesFilterBar");
    expect(guides).toContain("guidesTableNowrap");
    expect(guides).toContain("AdminEnterpriseListVirtualBody");
    expect(guides).toContain("shouldVirtualizeAdminEnterpriseList");
    expect(guides).toContain("shortAdminId");
    expect(guides).toContain("ADMIN_TABLE_TD_TIMESTAMP_CLASS");
    expect(guides).toContain("<select");
    expect(guides).toContain("draftCity");
    expect(guides).toContain("draftCountry");
    expect(guides).toContain("draftQ");
    expect(guides).toContain("errorKey={error}");
    expect(guides).toContain('data-tt-admin-guides-q');
    expect(guides).toContain('data-tt-admin-guides-city');
    expect(guides).toContain('data-tt-admin-guides-country');
    expect(guides).not.toMatch(/filter_status[\s\S]{0,200}type=["']text["']/i);
    expect(guides).not.toContain("data_origin");
  });

  it("Orders page exposes force-readonly honesty (R042)", () => {
    const orders = read("app/admin/orders/AdminOrdersPageMain.tsx");
    expect(orders).toContain("AdminEnterpriseOrdersReadonlyHonesty");
  });

  it("zh/en expose Cut B enterprise honesty keys", () => {
    const zh = read("locales/zh.ts");
    const en = read("locales/en.ts");
    for (const src of [zh, en]) {
      expect(src).toContain("admin_enterprise_lifecycle_active");
      expect(src).toContain("admin_enterprise_tip_honesty_fe");
      expect(src).toContain("admin_enterprise_content_surface_title");
      expect(src).toContain("admin_enterprise_orders_readonly_title");
      expect(src).toContain("admin_guides_directory_status_active");
      expect(src).toContain("admin_guides_status_all");
      expect(src).toContain("admin_guides_q_label");
      expect(src).toContain("admin_guides_city_filter_label");
      expect(src).toContain("admin_guides_country_filter_label");
      expect(src).toContain("admin_onboarding_hub_review_guide_desc");
      expect(src).toContain("admin_onboarding_hub_review_provider_desc");
      expect(src).toContain("admin_onboarding_hub_review_steward_desc");
    }
  });
});
