import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { ADMIN_INBOX_QUEUE_HREFS } from "./adminInboxQueueHrefs";
import { adminCommandPaletteEntries } from "./adminCommandPaletteEntries";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");

describe("admin command palette L5 (①)", () => {
  const recent = readFileSync(
    join(fe, "components", "admin", "AdminHomeRecentVisits.tsx"),
    "utf8",
  );
  const palette = readFileSync(
    join(fe, "components", "admin", "AdminCommandPalette.tsx"),
    "utf8",
  );

  it("AdminHomeRecentVisits resolves href via adminRecentVisitHref", () => {
    expect(recent).toContain("adminRecentVisitHref");
    expect(recent).not.toMatch(/href=\{path\}/);
  });

  it("includes unified inbox and inbox-key cards with queue SSOT hrefs", () => {
    const entries = adminCommandPaletteEntries("super_admin", () => true, true);
    const hrefs = entries.map((e) => e.href);
    expect(hrefs).toContain("/admin/inbox");
    expect(hrefs).toContain(ADMIN_INBOX_QUEUE_HREFS.provider);
    expect(hrefs).toContain(ADMIN_INBOX_QUEUE_HREFS.steward);
    expect(hrefs).toContain(ADMIN_INBOX_QUEUE_HREFS.approvals);
    expect(hrefs).toContain(ADMIN_INBOX_QUEUE_HREFS.reports);
    const reports = entries.find((e) => e.href === ADMIN_INBOX_QUEUE_HREFS.reports);
    expect(reports?.keywords).toContain("举报");
  });

  it("AdminCommandPalette wires entries helper", () => {
    expect(palette).toContain("adminCommandPaletteEntries");
    expect(palette).toContain('metaKey || e.ctrlKey) && e.key.toLowerCase() === "k"');
  });

  it("includes phase2 prep shortcuts for remaining backlog", () => {
    const entries = adminCommandPaletteEntries("super_admin", () => true, true);
    const hrefs = entries.map((e) => e.href);
    expect(hrefs).toContain("/admin/permissions#admin-phase2-remaining-backlog");
    expect(hrefs).toContain("/admin/onboarding/payment-events");
    expect(hrefs).toContain("/admin/finance-suite");
    expect(hrefs).toContain("/admin/operator-guide#admin-operator-guide-phase2-prep");
  });
});
