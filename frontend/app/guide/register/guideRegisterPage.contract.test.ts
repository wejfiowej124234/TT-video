import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readGuideRegisterPageModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "GuideRegisterPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "useGuideRegisterPage.ts"), "utf8"),
    readFileSync(join(__dir, "guideRegisterSubmitFlow.ts"), "utf8"),
    readFileSync(join(__dir, "guideRegisterPageModel.ts"), "utf8"),
  ].join("\n");
}

describe("guide register page (contract)", () => {
  const src = readGuideRegisterPageModuleSources();

  it("does not reference internal API paths", () => {
    expect(src).not.toMatch(/\/api\/v1\/internal\//);
  });

  it("keeps guide register client calls and page marker", () => {
    const page = readFileSync(join(__dir, "page.tsx"), "utf8");
    const main = readFileSync(join(__dir, "GuideRegisterPageMain.tsx"), "utf8");
    expect(src).toContain("postGuide");
    expect(src).toContain("postGuideUploadDoc");
    expect(src).toContain("GuideRegisterPageMain");
    expect(page).toContain("GuideRegisterPageMain");
    expect(src).toContain("PENDING_GUIDE_KEY");
    expect(main).toContain("guideRegisterBackHref");
    expect(main).toContain("data-tt-guide-register-back");
    expect(src).toContain("resolveRegisterBackPath");
  });
});
