import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");

describe("admin platform hub cross-nav L5 (①)", () => {
  const config = readFileSync(join(fe, "app", "admin", "config", "AdminConfigHubPageMain.tsx"), "utf8");
  const compliance = readFileSync(
    join(fe, "app", "admin", "compliance", "AdminComplianceHubPageMain.tsx"),
    "utf8",
  );
  const observability = readFileSync(
    join(fe, "app", "admin", "observability", "AdminObservabilityPageMain.tsx"),
    "utf8",
  );
  const authAudit = readFileSync(
    join(fe, "app", "admin", "auth-audit-events", "AdminAuthAuditEventsPageMain.tsx"),
    "utf8",
  );
  const queueChrome = readFileSync(join(fe, "components", "admin", "AdminQueueListPageChrome.tsx"), "utf8");
  const approvals = readFileSync(join(fe, "app", "admin", "approvals", "AdminApprovalsPageMain.tsx"), "utf8");

  it("hub pages use folded related nav + breadcrumb (not link wall)", () => {
    expect(config).toContain("AdminPlatformHubRelatedNav");
    expect(config).not.toContain("headerAside={<AdminInboxQueueBackLinks />}");
    expect(config).not.toContain("AdminPlatformHubHeaderLinks");
    expect(compliance).toContain("AdminPlatformHubRelatedNav");
    expect(compliance).not.toContain("headerAside={<AdminInboxQueueBackLinks />}");
    expect(compliance).not.toContain("AdminPlatformHubHeaderLinks");
    expect(observability).toContain("AdminObservabilityHubRelatedNav");
    expect(observability).not.toContain("AdminPlatformHubHeaderLinks");
    const hubLinks = readFileSync(
      join(fe, "components", "admin", "AdminPlatformHubHeaderLinks.tsx"),
      "utf8",
    );
    expect(hubLinks).toContain("AdminInboxQueueBackLinks");
  });

  it("queues and approvals link observability via related fold", () => {
    expect(queueChrome).toContain("AdminOpsDetailRelatedFold");
    expect(queueChrome).not.toContain("AdminOnboardingQueueBackLinks");
    expect(approvals).not.toContain("headerAside={<AdminOpsQueueBackLinks />}");
    const model = readFileSync(join(fe, "lib/admin/adminOpsListRelatedFoldLinks.ts"), "utf8");
    expect(model).toContain("ADMIN_OPS_OBSERVABILITY_RELATED_LINK");
    expect(model).toMatch(/PROVIDER_QUEUE_RELATED_FOLD_LINKS[\s\S]*ADMIN_OPS_OBSERVABILITY_RELATED_LINK/);
    const back = readFileSync(join(fe, "components", "admin", "AdminInboxQueueBackLinks.tsx"), "utf8");
    expect(back).toContain("data-tt-admin-queue-back-inbox");
    expect(back).toContain('href="/admin/inbox"');
  });

  it("auth audit uses productized subtitle", () => {
    expect(authAudit).toContain("admin_auth_audit_events_subtitle_l5");
  });

  it("auth audit uses audit section back links not platform link wall (P2-1 batch 10)", () => {
    expect(authAudit).toContain("AdminAuditSectionBackLinks");
    expect(authAudit).not.toContain("AdminPlatformHubHeaderLinks");
  });
});
