import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

describe("admin community penalties page L5 (①)", () => {
  it("keeps list page anchors", () => {
    const src = [
      readFileSync(join(__dir, "page.tsx"), "utf8"),
      readFileSync(join(__dir, "AdminCommunityPenaltiesPageMain.tsx"), "utf8"),
    ].join("\n");
    expect(src).toContain("AdminCommunityPenaltiesPageMain");
    expect(src).toContain("AdminCommunityPageShell");
    expect(src).toContain("admin_penalties_title");
    expect(src).toContain("AdminPermissionDeniedBanner");
  });
});
