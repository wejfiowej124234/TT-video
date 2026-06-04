import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminCrossCheckPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminCrossCheckPage.ts"), "utf8"),
    readFileSync(join(__dir, "adminCrossCheckPageModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin cross-check page", () => {
  const src = readModuleSources();

  it("keeps cross-check client fetch + normalize", () => {
    expect(src).toContain("getAdminCrossCheck");
    expect(src).toContain("normalizeAdminCrossCheckRead");
  });

  it("keeps admin DOM anchor and fetch log tag", () => {
    expect(src).toContain("AdminListPageChrome");
    expect(src).toContain('"AdminCrossCheckPage"');
    expect(src).toContain("AdminListFetchError");
    expect(src).toContain("AdminPermissionDeniedBanner");
    expect(src).toContain("AdminFinanceModuleDepthWorkspace");
  });
});
