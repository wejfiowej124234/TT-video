import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminConfigHubPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminConfigHubPage.ts"), "utf8"),
    readFileSync(join(__dir, "adminConfigHubPageModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin config hub page", () => {
  const src = readModuleSources();

  it("keeps hub links + meta build + DOM anchor", () => {
    expect(src).toContain("CONFIG_HUB_LINKS");
    expect(src).toContain("/admin/flags");
    expect(src).toContain("/admin/policies");
    expect(src).toContain("/admin/lifecycle");
    expect(src).toContain("/admin/api-versions");
    expect(src).toContain("AdminPlatformHubRelatedNav");
    expect(src).toContain("CONFIG_HUB_RELATED_FOLD_LINKS");
    expect(src).not.toContain("headerAside={<AdminInboxQueueBackLinks />}");
    expect(src).toContain("AdminConfigHubMetaBuild");
    expect(src).toContain("AdminDetailPageChrome");
  });
});
