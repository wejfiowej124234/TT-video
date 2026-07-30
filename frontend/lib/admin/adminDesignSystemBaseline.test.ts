import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ADMIN_DEPLOY_ENV_MAY_LABEL_ONLY,
  ADMIN_DESIGN_SYSTEM_LOCKED_SURFACES,
  ADMIN_SHELL_ROOT_COMPONENT,
  ADMIN_WORKBENCH_LAYOUT_DRIVER,
  TT_ADMIN_DESIGN_SYSTEM_FREEZE_DECLARED_UTC,
  TT_ADMIN_DESIGN_SYSTEM_PRODUCT_RELEASE_BASELINE_MARK,
  adminDesignSystemIsProductReleaseBaselineSoleUiUxSsot,
  adminStagingAndProductionShareReleaseGradeShell,
  adminUiUxBaselineFailClosedGates,
  adminWorkbenchLayoutIsEnvGated,
} from "./adminDesignSystemBaseline";

const repoFrontend = join(__dirname, "../..");

function readSrc(relFromFrontend: string): string {
  return readFileSync(join(repoFrontend, relFromFrontend), "utf8");
}

describe("adminDesignSystemBaseline · Product Release Baseline sole UI/UX SSOT", () => {
  it("declares freeze mark and locked surfaces (no redesign fork)", () => {
    expect(TT_ADMIN_DESIGN_SYSTEM_PRODUCT_RELEASE_BASELINE_MARK).toMatch(
      /^tt_admin_design_system_product_release_baseline/,
    );
    expect(TT_ADMIN_DESIGN_SYSTEM_FREEZE_DECLARED_UTC).toBe("2026-07-30");
    expect(ADMIN_DESIGN_SYSTEM_LOCKED_SURFACES.length).toBeGreaterThanOrEqual(8);
    expect(ADMIN_SHELL_ROOT_COMPONENT).toBe("AdminCapabilitiesShell");
    expect(ADMIN_WORKBENCH_LAYOUT_DRIVER).toBe("inbox_focus_product_baseline_default");
    expect(ADMIN_DEPLOY_ENV_MAY_LABEL_ONLY).toBe(true);
    expect(adminDesignSystemIsProductReleaseBaselineSoleUiUxSsot()).toBe(true);
    expect(adminWorkbenchLayoutIsEnvGated()).toBe(false);
    expect(adminStagingAndProductionShareReleaseGradeShell()).toBe(true);
  });

  it("keeps fail-closed gates until Runtime ≡ Baseline", () => {
    expect(adminUiUxBaselineFailClosedGates()).toEqual({
      PRR_READY: false,
      TT_REALITY_CLOSURE: "NOT_ARMED",
      TT_PRODUCTION_GO: "NO_GO",
      RELEASE_GRADE: "NO",
    });
  });

  it("admin layout always wraps AdminCapabilitiesShell (all /admin/* inherit)", () => {
    const layout = readSrc("app/admin/layout.tsx");
    expect(layout).toContain('from "@/components/admin/AdminCapabilitiesShell"');
    expect(layout).toMatch(/return\s*<AdminCapabilitiesShell>/);
    expect(layout).not.toMatch(/NEXT_PUBLIC_.*LAYOUT/);
  });

  it("inbox focus policy is Product Baseline default (no env / pending resolve branch)", () => {
    const policy = readSrc("lib/admin/adminShellUxPolicy.ts");
    const fnStart = policy.indexOf("export function adminHomeInboxFocusLayoutActive");
    expect(fnStart).toBeGreaterThanOrEqual(0);
    const fnBody = policy.slice(fnStart, fnStart + 800);
    expect(fnBody).not.toMatch(/NEXT_PUBLIC_/);
    expect(fnBody).not.toMatch(/process\.env/);
    expect(fnBody).not.toMatch(/deployEnv|DEPLOY_ENV|staging|production/i);
    expect(fnBody).not.toContain("resolveAdminHomeInboxPendingTotal");
    expect(fnBody).toMatch(/return true/);
  });

  it("AdminHomeClient drives focus from policy (shared Stg+Prod)", () => {
    const home = readSrc("components/admin/AdminHomeClient.tsx");
    expect(home).toContain("adminHomeInboxFocusLayoutActive");
    expect(home).not.toMatch(
      /adminHomeInboxFocusLayoutActive[\s\S]{0,200}NEXT_PUBLIC_ADMIN_DEPLOY_ENV/,
    );
  });

  it("AdminCapabilitiesShell emits zone root markers for Runtime cert", () => {
    const shell = readSrc("components/admin/AdminCapabilitiesShell.tsx");
    expect(shell).toContain("TT_ADMIN_ZONE_ROOT");
    expect(shell).toContain('data-tt-admin-zone-root="1"');
    expect(shell).toContain("adminUi");
  });
});
