import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

describe("admin community moderation cases page L5 (①)", () => {
  it("keeps list page anchors", () => {
    const src = [
      readFileSync(join(__dir, "page.tsx"), "utf8"),
      readFileSync(join(__dir, "AdminCommunityModerationCasesPageMain.tsx"), "utf8"),
      readFileSync(join(__dir, "useAdminModerationCasesPage.ts"), "utf8"),
      readFileSync(join(__dir, "..", "..", "..", "..", "..", "lib/admin/useAdminStandardListFetch.ts"), "utf8"),
    ].join("\n");
    expect(src).toContain("AdminCommunityModerationCasesPageMain");
    expect(src).toContain("useAdminStandardListFetch");
    expect(src).toContain("AdminCommunityPageShell");
  });
});
