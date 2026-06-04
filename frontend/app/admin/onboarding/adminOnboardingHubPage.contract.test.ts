import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminOnboardingHubPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "adminOnboardingHubPageModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin onboarding hub page", () => {
  const src = readModuleSources();

  it("keeps onboarding hub links + permission banner + DOM anchor", () => {
    expect(src).toContain("ONBOARDING_HUB_LINKS");
    expect(src).toContain("/admin/onboarding/entitlements");
    expect(src).toContain("AdminPermissionDeniedBanner");
    expect(src).toContain('"data-tt-admin-onboarding-hub": "1"');
    expect(src).toContain("AdminDetailPageChrome");
  });
});
