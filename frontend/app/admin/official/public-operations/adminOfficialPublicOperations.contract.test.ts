import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { routes } from "@/lib/api/routes";
import { publicOperationsDrillDownHref } from "@/lib/admin/adminPublicOperationsDrillDown";

const __dir = join(process.cwd(), "app/admin/official/public-operations");

describe("Public Operations contract", () => {
  it("routes expose public-operations stats and publish APIs", () => {
    expect(routes.adminOfficialPublicOperationsStats).toBe(
      "/api/v1/admin/official/public-operations/stats",
    );
    expect(routes.adminOfficialPublicOperationsPublishQueue).toBe(
      "/api/v1/admin/official/public-operations/publish-queue",
    );
    expect(routes.adminOfficialPublicOperationsEntityPublish("guides", "id-1")).toBe(
      "/api/v1/admin/official/public-operations/entities/guides/id-1/publish",
    );
    expect(routes.adminOfficialPublicOperationsEntityFeatured("guides", "id-1")).toBe(
      "/api/v1/admin/official/public-operations/entities/guides/id-1/featured",
    );
    expect(routes.adminOfficialPublicOperationsEntityPriority("orders", "id-2")).toBe(
      "/api/v1/admin/official/public-operations/entities/orders/id-2/priority",
    );
  });

  it("page has statistics drill-down and publish/unpublish tab", () => {
    const main = readFileSync(join(__dir, "AdminOfficialPublicOperationsPageMain.tsx"), "utf8");
    const statsHook = readFileSync(join(__dir, "useAdminOfficialPublicOperationsPage.ts"), "utf8");
    const publish = readFileSync(join(__dir, "AdminOfficialPublicOperationsPublishPanel.tsx"), "utf8");
    const hook = readFileSync(join(__dir, "useAdminOfficialPublicOperationsPublishTab.ts"), "utf8");
    expect(statsHook).toContain("getAdminOfficialPublicOperationsStats");
    expect(main).toContain("data-tt-admin-public-operations-stats");
    expect(main).toContain("data-tt-admin-public-operations-drilldown");
    expect(main).toContain("data-tt-admin-public-operations-refresh");
    expect(main).toContain("data-tt-admin-public-operations-tabs");
    expect(main).toContain("AdminOfficialPublicOperationsPublishPanel");
    expect(publish).toContain("adminConfirmOfficialPublish");
    expect(publish).toContain("data-tt-admin-public-operations-publish");
    expect(publish).toContain("data-tt-admin-public-operations-publish-action");
    expect(publish).toContain("data-tt-admin-public-operations-unpublish-action");
    expect(hook).toContain("postAdminOfficialPublicOperationsPublish");
    expect(hook).toContain("postAdminOfficialPublicOperationsUnpublish");
    expect(publicOperationsDrillDownHref("guides", "production")).toBe(
      "/admin/guides?data_origin=production",
    );
  });

  it("page has featured and priority tabs with L5-gated write surfaces", () => {
    const main = readFileSync(join(__dir, "AdminOfficialPublicOperationsPageMain.tsx"), "utf8");
    const featured = readFileSync(join(__dir, "AdminOfficialPublicOperationsFeaturedPanel.tsx"), "utf8");
    const priority = readFileSync(join(__dir, "AdminOfficialPublicOperationsPriorityPanel.tsx"), "utf8");
    const listHook = readFileSync(join(__dir, "useAdminOfficialPublicOperationsDisplayList.ts"), "utf8");
    expect(main).toContain("AdminOfficialPublicOperationsFeaturedPanel");
    expect(main).toContain("AdminOfficialPublicOperationsPriorityPanel");
    expect(main).toContain('setTab("featured")');
    expect(main).toContain('setTab("priority")');
    expect(featured).toContain("data-tt-admin-public-operations-featured");
    expect(featured).toContain("adminConfirmOfficialPublish");
    expect(featured).toContain("patchAdminOfficialPublicOperationsFeatured");
    expect(priority).toContain("data-tt-admin-public-operations-priority");
    expect(priority).toContain("patchAdminOfficialPublicOperationsPriority");
    expect(listHook).toContain("featured_only");
  });

  it("page has surface tab with checkbox write surface", () => {
    const main = readFileSync(join(__dir, "AdminOfficialPublicOperationsPageMain.tsx"), "utf8");
    const surface = readFileSync(join(__dir, "AdminOfficialPublicOperationsSurfacePanel.tsx"), "utf8");
    expect(routes.adminOfficialPublicOperationsEntitySurfaces("guides", "id-1")).toBe(
      "/api/v1/admin/official/public-operations/entities/guides/id-1/surfaces",
    );
    expect(main).toContain("AdminOfficialPublicOperationsSurfacePanel");
    expect(main).toContain('setTab("surface")');
    expect(surface).toContain("data-tt-admin-public-operations-surface");
    expect(surface).toContain("patchAdminOfficialPublicOperationsSurfaces");
    expect(surface).toContain("PUBLIC_OPS_ENTITY_SURFACE_OPTIONS");
  });

  it("page has schedule tab with datetime write surface", () => {
    const main = readFileSync(join(__dir, "AdminOfficialPublicOperationsPageMain.tsx"), "utf8");
    const schedule = readFileSync(join(__dir, "AdminOfficialPublicOperationsSchedulePanel.tsx"), "utf8");
    expect(routes.adminOfficialPublicOperationsEntitySchedule("orders", "id-1")).toBe(
      "/api/v1/admin/official/public-operations/entities/orders/id-1/schedule",
    );
    expect(main).toContain("AdminOfficialPublicOperationsSchedulePanel");
    expect(main).toContain('setTab("schedule")');
    expect(schedule).toContain("data-tt-admin-public-operations-schedule");
    expect(schedule).toContain("patchAdminOfficialPublicOperationsSchedule");
    expect(schedule).toContain("display_start_at");
    expect(schedule).toContain("display_end_at");
  });

  it("page has preview tab with read-only visibility probe", () => {
    const main = readFileSync(join(__dir, "AdminOfficialPublicOperationsPageMain.tsx"), "utf8");
    const preview = readFileSync(join(__dir, "AdminOfficialPublicOperationsPreviewPanel.tsx"), "utf8");
    expect(routes.adminOfficialPublicOperationsEntityPreview("guides", "id-1")).toBe(
      "/api/v1/admin/official/public-operations/entities/guides/id-1/preview",
    );
    expect(main).toContain("AdminOfficialPublicOperationsPreviewPanel");
    expect(main).toContain('setTab("preview")');
    expect(preview).toContain("data-tt-admin-public-operations-preview");
    expect(preview).toContain("getAdminOfficialPublicOperationsPreview");
    expect(preview).toContain("data-tt-admin-public-operations-preview-result");
  });

  it("page has history tab with audit list", () => {
    const main = readFileSync(join(__dir, "AdminOfficialPublicOperationsPageMain.tsx"), "utf8");
    const history = readFileSync(join(__dir, "AdminOfficialPublicOperationsHistoryPanel.tsx"), "utf8");
    expect(routes.adminOfficialPublicOperationsHistory).toBe(
      "/api/v1/admin/official/public-operations/history",
    );
    expect(main).toContain("AdminOfficialPublicOperationsHistoryPanel");
    expect(main).toContain('setTab("history")');
    expect(history).toContain("data-tt-admin-public-operations-history");
    expect(history).toContain("getAdminOfficialPublicOperationsHistory");
  });

  it("page has test policy tab with policy API", () => {
    const main = readFileSync(join(__dir, "AdminOfficialPublicOperationsPageMain.tsx"), "utf8");
    const policy = readFileSync(join(__dir, "AdminOfficialPublicOperationsTestPolicyPanel.tsx"), "utf8");
    expect(routes.adminOfficialPublicOperationsPolicy).toBe(
      "/api/v1/admin/official/public-operations/policy",
    );
    expect(main).toContain("AdminOfficialPublicOperationsTestPolicyPanel");
    expect(main).toContain('setTab("test_policy")');
    expect(policy).toContain("data-tt-admin-public-operations-test-policy");
    expect(policy).toContain("patchAdminOfficialPublicOperationsPolicy");
  });

  it("page has campaign tab with six kinds and preview", () => {
    const main = readFileSync(join(__dir, "AdminOfficialPublicOperationsPageMain.tsx"), "utf8");
    const campaign = readFileSync(join(__dir, "AdminOfficialPublicOperationsCampaignPanel.tsx"), "utf8");
    const ssot = readFileSync(join(__dir, "../../../../lib/admin/officialOpsCampaign.ts"), "utf8");
    expect(routes.adminOfficialPublicOperationsCampaigns).toBe(
      "/api/v1/admin/official/public-operations/campaigns",
    );
    expect(main).toContain("AdminOfficialPublicOperationsCampaignPanel");
    expect(main).toContain('setTab("campaign")');
    expect(campaign).toContain("data-tt-admin-public-operations-campaign");
    expect(campaign).toContain("getAdminOfficialPublicOperationsCampaigns");
    expect(campaign).toContain("getAdminOfficialPublicOperationsCampaignPreview");
    expect(ssot).toContain("F-OO-14");
    expect(ssot).toContain("F-OO-19");
  });
});
