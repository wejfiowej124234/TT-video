import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

describe("admin auth audit events L5 (①)", () => {
  const main = readFileSync(join(__dir, "AdminAuthAuditEventsPageMain.tsx"), "utf8");

  it("uses i18n placeholder for event type filter", () => {
    expect(main).toContain("admin_auth_audit_events_event_type_ph");
    expect(main).not.toMatch(/placeholder="auth_login_failure"/);
  });

  it("uses audit section back links not platform link wall (P2-1 batch 10)", () => {
    expect(main).toContain("AdminAuditSectionBackLinks");
    expect(main).not.toContain("AdminPlatformHubHeaderLinks");
  });

  it("auth audit filters use ADMIN_FILTER field SSOT", () => {
    expect(main).toContain("ADMIN_FILTER_FIELD_LABEL_CLASS");
    expect(main).toContain("ADMIN_FILTER_GRID_CLASS");
  });
});
