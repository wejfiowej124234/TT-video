import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { ADMIN_PHASE2_REMAINING_BACKLOG_ITEMS } from "./adminPhase2RemainingBacklog";

const __dir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dir, "..", "..", "..");

/** 六项剩余 backlog · ① 机读 SSOT 对拍。 */
describe("admin phase2 remaining backlog L5 (①)", () => {
  const backlogDoc = readFileSync(
    join(
      repoRoot,
      "frontend/evidence/GO_local_admin_workspace_closure/ADMIN-L5-FULL-AUDIT-BACKLOG.md",
    ),
    "utf8",
  );
  const panel = readFileSync(
    join(__dir, "..", "..", "components", "admin", "AdminPhase2RemainingBacklogPanel.tsx"),
    "utf8",
  );
  const pageMain = readFileSync(
    join(repoRoot, "frontend/app/admin/permissions/AdminPermissionsPageMain.tsx"),
    "utf8",
  );

  it("defines exactly six backlog ids matching audit doc", () => {
    expect(ADMIN_PHASE2_REMAINING_BACKLOG_ITEMS).toHaveLength(6);
    for (const row of ADMIN_PHASE2_REMAINING_BACKLOG_ITEMS) {
      expect(backlogDoc, row.id).toContain(row.id);
    }
  });

  it("permissions page mounts backlog panel with open row anchors", () => {
    expect(pageMain).toContain("AdminPhase2RemainingBacklogPanel");
    expect(panel).toContain("data-tt-admin-phase2-remaining-backlog");
    expect(panel).toContain("data-tt-admin-phase2-remaining-row");
    expect(panel).toContain('data-tt-admin-phase2-remaining-open="1"');
    expect(panel).toContain("admin-phase2-remaining-backlog");
    expect(panel).toContain("data-tt-admin-phase2-remaining-prep-link");
  });

  it("each backlog row defines prepHref deep link", () => {
    for (const row of ADMIN_PHASE2_REMAINING_BACKLOG_ITEMS) {
      expect(row.prepHref.startsWith("/admin/"), row.id).toBe(true);
      expect(row.localPrepKey.startsWith("admin_phase2_backlog_cmd_"), row.id).toBe(true);
    }
    expect(ADMIN_PHASE2_REMAINING_BACKLOG_ITEMS.find((r) => r.id === "ADM-UX-CI-02")?.prepHref).toContain(
      "admin-phase2-staging-record",
    );
    expect(ADMIN_PHASE2_REMAINING_BACKLOG_ITEMS.find((r) => r.id === "ADM-UX-ONB-04")?.prepHref).toContain(
      "admin-onboarding-hub-ledger",
    );
  });

  it("panel renders local prep command anchors", () => {
    expect(panel).toContain("data-tt-admin-phase2-remaining-local-cmd");
    expect(panel).toContain("admin_phase2_backlog_col_local_cmd");
    expect(panel).toContain("adminPhase2LocalPrepCommand");
    expect(panel).toContain("AdminClipboardCopyButton");
  });
});
