import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { ADMIN_LIST_FETCH_BYPASS_SSOT } from "./adminListFetchBypassSSOT";
import { ADMIN_HOME_CARD_REQUIRED_PERM } from "./adminHomeCardPermission";
import { ADMIN_PERM } from "./adminPermissionIds";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const evidence = join(fe, "evidence", "GO_local_admin_workspace_closure");

/** ① · Admin Phase1 满分收口闸：零 P0/P1 企业审计项 + 真源文档对拍。 */
describe("admin phase1 full closure L5 (①)", () => {
  const closure = readFileSync(join(evidence, "TT-ADMIN-PHASE1-FULL-CLOSURE.md"), "utf8");
  const readme = readFileSync(join(fe, "app", "admin", "README.md"), "utf8");
  const greenSh = readFileSync(join(fe, "..", "scripts", "dev", "run-admin-l5-green.sh"), "utf8");

  const P0_P1_CLOSED = [
    "ADM-P0-01",
    "ADM-P0-02",
    "ADM-P0-03",
    "ADM-P1-01",
    "ADM-P1-02",
    "ADM-P1-03",
    "ADM-P1-04",
    "ADM-P1-05",
    "ADM-P1-06",
    "ADM-P1-07",
    "ADM-P1-08",
    "ADM-P1-09",
    "ADM-P1-10",
    "P1-ADM-AUD-02",
  ] as const;

  it("closure doc attests zero open P0/P1", () => {
    expect(closure).toContain("TT-ADMIN-PHASE1-FULL-CLOSURE");
    expect(closure).toMatch(/零 P0.*零 P1|P0.*0.*P1.*0/i);
    for (const id of P0_P1_CLOSED) {
      expect(closure, id).toContain(id);
      expect(closure, `${id} open`).not.toMatch(new RegExp(`\\| ${id} \\|.*❌`));
    }
  });

  it("ADM-P0-01 server + client actor gate wired", () => {
    expect(readFileSync(join(fe, "app", "admin", "layout.tsx"), "utf8")).toContain(
      "assertAdminConsoleServerGate",
    );
    expect(readFileSync(join(fe, "components", "admin", "AdminCapabilitiesShell.tsx"), "utf8")).toContain(
      "AdminConsoleActorGate",
    );
    expect(readFileSync(join(__dir, "useAdminCapabilities.ts"), "utf8")).toContain(
      "writeAdminConsoleAccessCookie",
    );
  });

  it("ADM-P0-03 UI RBAC advisory documented", () => {
    expect(readme).toMatch(/UI.*advisory|advisory.*API|UI ≠ 安全|UI 仅为辅助/i);
    expect(readFileSync(join(__dir, "adminUiRbacAdvisory.ts"), "utf8")).toContain(
      "ADMIN_UI_RBAC_ADVISORY_MARKER",
    );
  });

  it("ADM-P1-05 inbox + operator-guide explicit perms", () => {
    expect(ADMIN_HOME_CARD_REQUIRED_PERM["/admin/inbox"]).toBe(ADMIN_PERM.READ);
    expect(ADMIN_HOME_CARD_REQUIRED_PERM["/admin/operator-guide"]).toBe(ADMIN_PERM.READ);
  });

  it("ADM-P1-06 stale-while-error SSOT in list fetch hook", () => {
    expect(readFileSync(join(__dir, "useAdminStandardListFetch.ts"), "utf8")).toContain("staleWhileError");
    expect(readFileSync(join(fe, "components", "admin", "AdminListFetchError.tsx"), "utf8")).toContain(
      "data-tt-admin-list-stale-while-error",
    );
  });

  it("ADM-P1-07 documents list fetch bypass pages", () => {
    expect(ADMIN_LIST_FETCH_BYPASS_SSOT.length).toBeGreaterThanOrEqual(3);
    for (const row of ADMIN_LIST_FETCH_BYPASS_SSOT) {
      expect(readFileSync(join(fe, row.file), "utf8")).toContain(row.hook);
    }
  });

  it("ADM-P1-08/09/10 + audit contracts in green set", () => {
    const required = [
      "adminLocaleParityL5.contract.test.ts",
      "adminPhase1FullClosureL5.contract.test.ts",
      "adminListStaleWhileErrorL5.contract.test.ts",
      "adminHomeSectionPending.test.ts",
      "adminCapabilitiesFetchCache.test.ts",
      "adminShellPrefetchHref.test.ts",
      "adminFinanceReconciliationBundleFetch.test.ts",
      "adminHomeOverviewFetchCache.test.ts",
      "adminHomeSystemOverviewMetrics.test.ts",
      "adminShellNavGroupsL5.contract.test.ts",
      "adminRoutePrefetchL5.contract.test.ts",
      "adminShellOnboardingNavL5.contract.test.ts",
    ];
    for (const name of required) {
      expect(greenSh, name).toContain(name);
    }
  });

  it("P1-ADM-AUD-02 provider/steward PATCH audit", () => {
    const audit = readFileSync(join(__dir, "adminAuditLogWriteL5.contract.test.ts"), "utf8");
    expect(audit).toContain("admin_provider_application_http.rs");
    expect(audit).toContain("admin_steward_application_http.rs");
  });

  it("spec 70 §3.0.2 cross-references closure attestation", () => {
    const spec70 = readFileSync(
      join(__dir, "..", "..", "..", "docs", "spec", "70-管理员系统开发文档.md"),
      "utf8",
    );
    expect(spec70).toContain("TT-ADMIN-PHASE1-FULL-CLOSURE.md");
    expect(spec70).toContain("ADM-P0-01");
    expect(spec70).toContain("adminPhase1FullClosureL5");
  });
});
