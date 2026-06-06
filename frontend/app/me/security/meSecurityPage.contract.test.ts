import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

describe("me security page (sessions/notifications · API-backed · L5)", () => {
  const hook = readFileSync(join(__dir, "useMeSecurityPage.ts"), "utf8");
  const main = readFileSync(join(__dir, "MeSecurityPageMain.tsx"), "utf8");
  const page = readFileSync(join(__dir, "page.tsx"), "utf8");

  it("loads sessions and notifications via apiClient only", () => {
    expect(hook).toContain("getMeSessions");
    expect(hook).toContain("getMeSecurityNotifications");
    expect(hook).toContain("deleteMeSessionCurrent");
    expect(hook).toContain("deleteMeSessionBySuffix");
    expect(hook).not.toMatch(/items\s*=\s*\[\s*\{[^}]*session_token_suffix/);
  });

  it("hydrates lists from API items envelope, not seeded fixture rows", () => {
    expect(hook).toContain("?.items");
    expect(hook).toMatch(/useState<MeSessionItem\[\]>\(\[\]\)/);
    expect(hook).toMatch(/useState<SecurityNotificationItem\[\]>\(\[\]\)/);
    expect(hook).not.toMatch(/useState\s*\(\s*\[\s*\{[^}]*session_token_suffix/);
  });

  it("surfaces load errors and L5 confirm before destructive session revoke", () => {
    expect(hook).toContain("setError");
    expect(hook).not.toContain("window.confirm");
    expect(hook).toContain("useMeSettingsL5Confirm");
    expect(hook).toContain("confirm.request");
    expect(main).toContain("MeSettingsL5ConfirmDialog");
    expect(hook).toContain("loadAll");
    expect(hook).toContain("activeSessions");
    expect(hook).toContain("visibleNotifications");
  });

  it("sessions list previews first five with expand toggle", () => {
    const sessions = readFileSync(join(__dir, "MeSecuritySessionsSection.tsx"), "utf8");
    expect(sessions).toContain("SESSIONS_PREVIEW_COUNT = 5");
    expect(sessions).toContain("data-tt-me-security-sessions-toggle");
    expect(sessions).toContain("me_security_page_sessions_show_all");
  });

  it("uses L5 settings flow shell (not console marketing account shell)", () => {
    expect(main).toContain("MeSettingsL5FlowPage");
    expect(main).toContain("MeSettingsHubBackLink");
    expect(main).not.toContain("TT_MARKETING_ACCOUNT_PAGE_SHELL");
    expect(page).toContain("MeSecurityPageMain");
    expect(page).not.toContain("getMeSessions");
  });
});
