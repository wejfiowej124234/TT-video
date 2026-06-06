import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const PAGE = readFileSync(join(ROOT, "app/guide/register/GuideRegisterPageMain.tsx"), "utf8");
const MAIN_FORM = readFileSync(join(ROOT, "app/guide/register/GuideRegisterMainForm.tsx"), "utf8");
const CONFIRM = readFileSync(join(ROOT, "app/guide/register/GuideRegisterConfirmSection.tsx"), "utf8");
const FREEZE = readFileSync(join(ROOT, "evidence/GO_local_auth_l5/GUIDE-REGISTER-UI-FREEZE.md"), "utf8");

describe("guideRegister UI freeze (① · GUIDE-REGISTER-UI-FREEZE)", () => {
  it("freeze doc and machine anchors exist", () => {
    expect(FREEZE).toContain("data-tt-guide-register-ui-frozen");
    expect(FREEZE).toContain("guide_apply");
    expect(FREEZE).toContain("guideRegisterUiFreeze");
  });

  it("shell uses Auth L5 and trust banner", () => {
    expect(PAGE).toContain("AuthL5PageBackdrop");
    expect(PAGE).toContain("AuthL5Card");
    expect(PAGE).toContain("GuideRegisterContextBanners");
    const CONTEXT = readFileSync(join(process.cwd(), "app/guide/register/GuideRegisterContextBanners.tsx"), "utf8");
    expect(CONTEXT).toContain("TrustGrowthMomentBanner");
    expect(CONTEXT).toContain('moment="guide_apply"');
    expect(CONTEXT).toContain("preferCollapsedSummary");
    expect(PAGE).toContain("guideRegister_eyebrow");
    expect(PAGE).not.toContain("me_identities_hub_eyebrow");
  });

  it("pending and status panels require account session sync", () => {
    const page = readFileSync(join(ROOT, "app/guide/register/GuideRegisterPageMain.tsx"), "utf8");
    const hook = readFileSync(join(ROOT, "app/guide/register/useGuideRegisterPage.ts"), "utf8");
    expect(page).toContain("isPendingGuide && isLoggedIn === true");
    expect(hook).toContain("useRegisterPageAccountSession");
    expect(hook).toContain("setIsPendingGuide(false)");
  });

  it("form uses AuthL5Checkbox and step flow", () => {
    expect(CONFIRM).toContain("AuthL5Checkbox");
    expect(MAIN_FORM).toContain("GuideRegisterServiceFields");
    expect(MAIN_FORM).toContain("GuideRegisterConfirmSection");
    expect(CONFIRM).not.toMatch(/\btype="checkbox"/);
    expect(MAIN_FORM).toContain("data-tt-guide-register-submit");
    expect(PAGE).toContain("GuideRegisterRejectedGate");
    expect(PAGE).toContain("GuideRegisterSuspendedPanel");
  });
});
