import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

/** CMP-01：DSAR 合规请求工作台动线（①）。 */
describe("admin compliance DSAR workflow L5 (①)", () => {
  const notice = readFileSync(
    join(__dir, "..", "..", "components", "admin", "AdminComplianceDsarWorkflowNotice.tsx"),
    "utf8",
  );
  const pageMain = readFileSync(
    join(__dir, "..", "..", "app", "admin", "compliance", "requests", "AdminComplianceRequestsPageMain.tsx"),
    "utf8",
  );

  it("defines DSAR workflow notice with list → events → update chain", () => {
    expect(notice).toContain("AdminNoticeBanner");
    expect(notice).toContain("admin_compliance_dsar_workflow_notice");
    expect(notice).toContain("admin_compliance_events_title");
    expect(notice).toContain("admin_compliance_update_title");
    expect(notice).toContain("data-testid=\"admin-compliance-dsar-workflow-notice\"");
  });

  it("compliance requests page mounts workflow notice", () => {
    expect(pageMain).toContain("AdminComplianceDsarWorkflowNotice");
  });

  it("compliance hub mounts workflow notice", () => {
    const hub = readFileSync(
      join(__dir, "..", "..", "app", "admin", "compliance", "AdminComplianceHubPageMain.tsx"),
      "utf8",
    );
    expect(hub).toContain("AdminComplianceDsarWorkflowNotice");
  });

  it("DSAR events/update detail pages mount workflow notice", () => {
    for (const rel of [
      "compliance/requests/[requestId]/events/AdminComplianceRequestEventsPageMain.tsx",
      "compliance/requests/[requestId]/update/AdminComplianceRequestUpdatePageMain.tsx",
    ]) {
      const src = readFileSync(join(__dir, "..", "..", "app", "admin", rel), "utf8");
      expect(src).toContain("AdminComplianceDsarWorkflowNotice");
    }
  });
});
