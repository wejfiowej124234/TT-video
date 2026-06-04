import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminOperatorGuidePageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "adminOperatorGuidePageModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin operator guide page", () => {
  const src = readModuleSources();

  it("keeps operator flow links + DOM anchor", () => {
    expect(src).toContain("OPERATOR_GUIDE_FLOW_LINKS");
    expect(src).toContain("OPERATOR_GUIDE_ROLE_PREP_LINKS");
    expect(src).toContain("OPERATOR_GUIDE_PHASE2_PREP_COMMANDS");
    expect(src).toContain("admin-operator-guide-phase2-prep");
    expect(src).toContain("admin-phase2-remaining-backlog");
    expect(src).toContain("admin-console-role-self-assign");
    expect(src).toContain("admin-shell-preview");
    expect(src).toContain("admin-adm-u01-local-prep");
    expect(src).toContain("admin-operator-guide-adm-u01-shell-matrix");
    expect(src).toContain("/admin/finance-suite");
    expect(src).toContain("data-tt-admin-operator-guide-role-prep");
    expect(src).toContain('id="admin-operator-guide-role-prep"');
    expect(src).toContain("ADMIN_INBOX_QUEUE_HREFS");
    expect(src).toContain("admin_operator_guide_title");
    expect(src).toContain('"data-tt-admin-operator-guide": "1"');
    expect(src).toContain("AdminListPageChrome");
    expect(src).toContain("AdminNoticeBanner");
    expect(src).toContain("ADMIN_STEP_MARKER_CLASS");
  });
});
