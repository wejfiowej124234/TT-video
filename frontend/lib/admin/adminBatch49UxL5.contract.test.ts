import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const repoRoot = join(__dir, "..", "..", "..");

/** ① 第四十九批 UX · 经营列表 + 财务域顶栏 link wall 瘦身。 */
describe("admin batch49 UX L5 (①)", () => {
  it("run-admin-l5-green includes batch49 contract", () => {
    const green = readFileSync(join(repoRoot, "scripts/dev/run-admin-l5-green.sh"), "utf8");
    expect(green).toContain("lib/admin/adminBatch49UxL5.contract.test.ts");
  });

  it("users and approvals lists slim header + related fold SSOT", () => {
    const users = readFileSync(join(fe, "app/admin/users/AdminUsersPageMain.tsx"), "utf8");
    const approvals = readFileSync(join(fe, "app/admin/approvals/AdminApprovalsPageMain.tsx"), "utf8");
    const opsLinks = readFileSync(join(fe, "lib/admin/adminOpsListRelatedFoldLinks.ts"), "utf8");
    expect(users).toContain("AdminOpsDetailRelatedFold");
    expect(users).toContain("USERS_LIST_RELATED_FOLD_LINKS");
    const usersHeader = users.match(/headerAside=\{([\s\S]*?)\}\s*\r?\n\s*>/);
    expect(usersHeader?.[1] ?? "").not.toContain("admin-ops-cross-approvals");
    expect(users).toContain('data-tt-admin-ops-cross-approvals="1"');
    expect(users).toContain("adminTableRowPrimaryActionClass");
    expect(approvals).toContain("APPROVALS_LIST_RELATED_FOLD_LINKS");
    expect(opsLinks).toContain("admin-ops-cross-users");
  });

  it("finance peer pages use related fold not header link wall", () => {
    for (const rel of [
      "app/admin/fee-router/AdminFeeRouterPageMain.tsx",
      "app/admin/region-vault/AdminRegionVaultPageMain.tsx",
      "app/admin/finance/AdminFinancePageMain.tsx",
      "app/admin/audit/AdminAuditPageMain.tsx",
    ]) {
      const src = readFileSync(join(fe, rel), "utf8");
      expect(src, rel).toContain("AdminOpsDetailRelatedFold");
      expect(src, rel).toContain("AdminFinanceSectionBackLinks");
    }
    const model = readFileSync(join(fe, "lib/admin/adminFinanceRelatedFoldLinks.ts"), "utf8");
    expect(model).toContain("financePeerRelatedFoldLinks");
    expect(model).toContain("AUDIT_LIST_RELATED_FOLD_LINKS");
  });

  it("indexer hub moves reconcile link to fold and refresh to body", () => {
    const main = readFileSync(join(fe, "app/admin/indexer/AdminIndexerPageMain.tsx"), "utf8");
    expect(main).toContain("INDEXER_HUB_RELATED_FOLD_LINKS");
    expect(main).toContain('data-tt-admin-indexer-refresh="1"');
    expect(main).not.toContain("admin_indexer_reconcile_reports_title");
  });
});
