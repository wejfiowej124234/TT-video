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
    expect(readFileSync(join(__dir, "guideRegisterSubmitFlow.ts"), "utf8")).toContain(
      'from "@/lib/constants"',
    );
    expect(readFileSync(join(__dir, "guideRegisterSubmitFlow.ts"), "utf8")).toContain("PENDING_GUIDE_KEY");
    expect(src).toContain("GuideRegisterPageMain");
    expect(page).toContain("GuideRegisterPageMain");
    expect(src).toContain("PENDING_GUIDE_KEY");
    expect(main).toContain("guideRegisterBackHref");
    expect(main).toContain("data-tt-guide-register-back");
    expect(readFileSync(join(__dir, "GuideRegisterMainForm.tsx"), "utf8")).toContain(
      "data-tt-guide-register-step3-debug",
    );
    expect(readFileSync(join(__dir, "GuideRegisterConfirmSection.tsx"), "utf8")).toContain(
      "data-tt-guide-register-agree-wrap",
    );
    expect(src).toContain("resolveRegisterBackPath");
  });

  it("done panel defers staking to workbench after admin approval (no /staking link)", () => {
    const done = readFileSync(join(__dir, "GuideRegisterDonePanel.tsx"), "utf8");
    expect(done).not.toContain('href="/staking"');
    expect(done).toContain("guideRegister_doneStakingNote");
    expect(done).toContain('href="/guide"');
  });
});
