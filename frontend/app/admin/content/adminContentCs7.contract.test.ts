import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { routes } from "@/lib/api/routes";
import { adminCatalogPublishQueueAdminPath } from "@/lib/admin/adminCatalogPublishQueueNav";

describe("C-S7 translation admin contract", () => {
  it("routes expose translation admin API", () => {
    expect(routes.adminContentTranslations).toBe("/api/v1/admin/content/translations");
  });

  it("publish queue maps catalog_translation_entries to translation module", () => {
    expect(adminCatalogPublishQueueAdminPath("catalog_translation_entries")).toBe("/admin/content/translation");
  });

  it("translation page supports CRUD and publish workflow", () => {
    const page = readFileSync(
      join(process.cwd(), "app/admin/content/translation/AdminContentTranslationPageMain.tsx"),
      "utf8",
    );
    const hook = readFileSync(
      join(process.cwd(), "app/admin/content/translation/useAdminContentTranslationPage.ts"),
      "utf8",
    );
    expect(page).toContain("adminConfirmCatalogPublish");
    expect(page).toContain("data-tt-admin-content-translation-list");
    expect(hook).toContain("postAdminContentTranslation");
    expect(hook).toContain("patchAdminContentTranslation");
    expect(hook).toContain("postAdminContentTranslationWorkflow");
  });
});
