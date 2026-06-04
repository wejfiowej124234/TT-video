import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

describe("admin recent visits L5 (①)", () => {
  const src = readFileSync(join(__dir, "adminRecentVisits.ts"), "utf8");

  it("imports inbox SSOT for queue path → href map", () => {
    expect(src).toContain("ADMIN_INBOX_QUEUE_HREFS");
    expect(src).toContain("adminRecentVisitHref");
    expect(src).not.toContain("?status=submitted");
    expect(src).toContain('pathname.split("?")[0]');
  });

  it("maps four queue pathnames via SSOT constants", () => {
    expect(src).toContain("ADMIN_INBOX_QUEUE_HREFS.provider");
    expect(src).toContain("ADMIN_INBOX_QUEUE_HREFS.reports");
    expect(src).toContain('"/admin/provider-applications"');
    expect(src).toContain('"/admin/community/reports"');
  });
});
