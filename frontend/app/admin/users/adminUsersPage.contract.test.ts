import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

describe("admin users page L5 (①)", () => {
  it("keeps list page anchors", () => {
    const src = [
      readFileSync(join(__dir, "page.tsx"), "utf8"),
      readFileSync(join(__dir, "AdminUsersPageMain.tsx"), "utf8"),
      readFileSync(join(__dir, "AdminUsersDataSection.tsx"), "utf8"),
    ].join("\n");
    expect(src).toContain("AdminUsersPageMain");
    expect(src).toContain("AdminPermissionDeniedBanner");
    expect(src).toContain("useAdminUsersPage");
    expect(src).toContain("ADMIN_EMPTY_NEXT_USERS_FILTERED_EMPTY");
    expect(src).toContain("USERS_LIST_RELATED_FOLD_LINKS");
    expect(src).not.toContain("headerAside={<AdminOpsQueueBackLinks />}");
    expect(src).toContain("AdminOpsDetailRelatedFold");
    expect(src).toContain("USERS_LIST_RELATED_FOLD_LINKS");
    expect(src).toContain("useAdminCanWrite");
    expect(src).toContain("ADMIN_PERM.USERS_WRITE");
    expect(src).toContain("data-tt-admin-users-write-gate");
  });
});
