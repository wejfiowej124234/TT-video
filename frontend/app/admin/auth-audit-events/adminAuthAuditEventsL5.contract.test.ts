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
});
