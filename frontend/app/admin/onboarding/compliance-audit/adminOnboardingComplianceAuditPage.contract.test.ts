import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

describe("admin onboarding compliance audit list L5 (①)", () => {
  it("keeps list page anchors", () => {
    const src = readFileSync(join(__dir, "page.tsx"), "utf8");
    expect(src).toContain("AdminOnboardingListPage");
    expect(src).toContain("admin_onb_compliance_title");
  });
});
