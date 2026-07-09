import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { routes } from "@/lib/api/routes";
import { adminCatalogPublishQueueAdminPath } from "@/lib/admin/adminCatalogPublishQueueNav";

describe("C-S8 SEO admin contract", () => {
  it("routes expose SEO admin API", () => {
    expect(routes.adminContentSeo).toBe("/api/v1/admin/content/seo");
  });

  it("publish queue maps catalog_seo_metadata to SEO module", () => {
    expect(adminCatalogPublishQueueAdminPath("catalog_seo_metadata")).toBe("/admin/content/seo");
  });

  it("SEO page supports CRUD and publish workflow", () => {
    const page = readFileSync(
      join(process.cwd(), "app/admin/content/seo/AdminContentSeoPageMain.tsx"),
      "utf8",
    );
    const hook = readFileSync(join(process.cwd(), "app/admin/content/seo/useAdminContentSeoPage.ts"), "utf8");
    expect(page).toContain("adminConfirmCatalogPublish");
    expect(page).toContain("data-tt-admin-content-seo-list");
    expect(hook).toContain("postAdminContentSeo");
    expect(hook).toContain("patchAdminContentSeo");
    expect(hook).toContain("postAdminContentSeoWorkflow");
  });
});
