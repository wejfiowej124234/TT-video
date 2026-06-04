import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const FE = join(__dir, "../..");

describe("admin route permission banner", () => {
  it("admin shell mounts route-level gate", () => {
    const shell = readFileSync(join(FE, "components/admin/AdminCapabilitiesShell.tsx"), "utf8");
    expect(shell).toContain("AdminRoutePermissionBanner");
    expect(shell).toContain("AdminCapabilitiesProvider");
  });

  it("banner skips duplicate page-level deny", () => {
    const src = readFileSync(join(FE, "components/admin/AdminRoutePermissionBanner.tsx"), "utf8");
    expect(src).toContain("data-tt-admin-perm-denied");
    expect(src).toContain("adminPermissionForPathname");
  });
});
