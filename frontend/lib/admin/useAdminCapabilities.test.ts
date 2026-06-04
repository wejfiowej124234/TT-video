import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { ADMIN_PERM } from "./adminPermissionIds";

const __dir = dirname(fileURLToPath(import.meta.url));

describe("useAdminCapabilities wiring", () => {
  it("targets capabilities API and permission ids", () => {
    const src = readFileSync(join(__dir, "useAdminCapabilities.ts"), "utf8");
    expect(src).toContain("routes.admin.capabilities");
    expect(src).toContain("permissions");
    expect(src).toContain("console_role_70");
    expect(src).toContain("phase2_prep");
    expect(src).toContain("permissionsLoaded");
    expect(src).toContain("capabilitiesUnavailable");
    expect(src).toContain("AdminCapabilitiesProvider");
    expect(src).toContain("AdminCapabilitiesContext");
    expect(ADMIN_PERM.APPROVE).toBe("admin.approve");
  });
});
