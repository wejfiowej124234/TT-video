import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { routes } from "@/lib/api/routes";

describe("admin backup page contract", () => {
  it("routes expose platform backup status API and page shell", () => {
    expect(routes.adminPlatformBackupStatus).toBe("/api/v1/admin/platform/backup-status");
    const page = readFileSync(join(process.cwd(), "app/admin/backup/AdminBackupPageMain.tsx"), "utf8");
    const hook = readFileSync(join(process.cwd(), "app/admin/backup/useAdminBackupPage.ts"), "utf8");
    expect(page).toContain("data-tt-admin-backup-page");
    expect(page).toContain("data-tt-admin-backup-status");
    expect(hook).toContain("getAdminPlatformBackupStatus");
  });
});
