import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

describe("admin provider applications page", () => {
  const src = [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminProviderApplicationsPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "..", "..", "..", "components/admin/AdminQueueListPageChrome.tsx"), "utf8"),
  ].join("\n");

  it("keeps queue chrome, URL status sync, admin fetch, and DOM anchors", () => {
    expect(src).toContain("AdminQueueListPageChrome");
    expect(src).toContain('queue="provider"');
    expect(src).toContain("fetchAdminQueueList");
    expect(src).toContain("routes.adminProviderApplications");
    expect(src).toContain('data-tt-admin-queue-list={queue}');
    expect(src).toContain("buildAdminQueueListPath");
    expect(src).toContain('DEFAULT_STATUS = "submitted"');
    expect(src).toContain("/admin/users/");
    expect(src).toContain("AdminListFetchError");
    expect(src).toContain("ADMIN_QUEUE_LIST_ROW_CARD_CLASS");
    expect(src).toContain('data-tt-admin-onboarding-queue-list="provider"');
    expect(src).toContain("ADMIN_EMPTY_NEXT_PROVIDER_QUEUE_EMPTY");
  });
});
