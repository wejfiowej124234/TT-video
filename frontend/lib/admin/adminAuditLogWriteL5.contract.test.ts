import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dir, "..", "..", "..");

/** ① 关键 Admin 写路由须 best-effort 审计（非 ③ 持久化 SLA）。 */
const AUDIT_WRITE_ROUTE_FILES = [
  "crates/api/src/routes/admin/admin_acquisition_suspend_http.rs",
  "crates/api/src/routes/admin/admin_compliance_http/update.rs",
  "crates/api/src/routes/admin/admin_onboarding/entitlements_write.rs",
  "crates/api/src/routes/admin/admin_community/moderation_patch.rs",
  "crates/api/src/routes/admin/admin_community/policy_mutations.rs",
  "crates/api/src/routes/admin/trust_growth_obs.rs",
  "crates/api/src/routes/admin/admin_rbac.rs",
  "crates/api/src/routes/admin/admin_jobs_scheduler.rs",
  "crates/api/src/routes/admin/admin_provider_application_http.rs",
  "crates/api/src/routes/admin/admin_steward_application_http.rs",
];

describe("admin audit write coverage (① · best-effort)", () => {
  it("critical admin write handlers call write_admin_audit_log_best_effort", () => {
    for (const rel of AUDIT_WRITE_ROUTE_FILES) {
      const src = readFileSync(join(REPO, rel), "utf8");
      expect(src, rel).toContain("write_admin_audit_log_best_effort");
    }
  });

  it("documents RBAC matrix smoke script for ① privilege escalation probe", () => {
    const sh = readFileSync(join(REPO, "scripts/dev/smoke-admin-rbac-matrix-local.sh"), "utf8");
    expect(sh).toContain("smoke-admin-rbac-matrix-local");
    expect(sh).toContain("console_role");
    const honesty = readFileSync(join(__dir, "adminPhase1DataHonesty.contract.test.ts"), "utf8");
    expect(honesty).toContain("smoke-admin-rbac-matrix-local.sh");
  });
});
