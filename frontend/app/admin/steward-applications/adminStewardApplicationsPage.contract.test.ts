import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

describe("admin steward applications page", () => {
  const src = [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminStewardApplicationsPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminStewardApplicationsPage.ts"), "utf8"),
    readFileSync(join(__dir, "..", "..", "..", "components/admin/AdminQueueListPageChrome.tsx"), "utf8"),
    readFileSync(join(__dir, "..", "..", "..", "components/admin/AdminOnboardingQueueBackLinks.tsx"), "utf8"),
  ].join("\n");

  it("keeps queue chrome, URL status sync, admin fetch, and DOM anchors", () => {
    expect(src).toContain("AdminQueueListPageChrome");
    expect(src).toContain('queue="steward"');
    expect(src).toContain("useAdminStandardListFetch");
    expect(src).toContain("useAdminStewardApplicationsPage");
    expect(src).toContain("routes.adminStewardApplications");
    expect(src).toContain('data-tt-admin-queue-list={queue}');
    expect(src).toContain("buildAdminQueueListPath");
    expect(src).toContain('DEFAULT_STATUS = "stake_pending"');
    expect(src).toContain("/admin/users/");
    expect(src).toContain("AdminSearchParamsSuspense");
    expect(src).toContain("AdminStandardListSection");
    expect(src).toContain("staleWhileError");
    expect(src).toContain("ADMIN_QUEUE_LIST_ROW_CARD_CLASS");
    expect(src).toContain('data-tt-admin-onboarding-queue-list="steward"');
    expect(src).toContain("ADMIN_EMPTY_NEXT_STEWARD_QUEUE_EMPTY");
    expect(src).toContain("AdminOnboardingQueueBackLinks");
    expect(src).toContain("data-tt-admin-back-onboarding-hub");
  });
});
