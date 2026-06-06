import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readRegisterPageModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "RegisterPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "useRegisterPage.ts"), "utf8"),
    readFileSync(join(__dir, "registerPageModel.ts"), "utf8"),
    readFileSync(join(__dir, "RegisterTouristForm.tsx"), "utf8"),
    readFileSync(join(__dir, "RegisterGuideForm.tsx"), "utf8"),
    readFileSync(join(__dir, "RegisterGuideFormAccountSection.tsx"), "utf8"),
    readFileSync(join(__dir, "RegisterGuideFormDidProfileSection.tsx"), "utf8"),
    readFileSync(join(__dir, "registerGuideFormTypes.ts"), "utf8"),
  ].join("\n");
}

describe("auth register page (contract)", () => {
  const src = readRegisterPageModuleSources();

  it("does not reference internal API paths", () => {
    expect(src).not.toMatch(/\/api\/v1\/internal\//);
  });

  it("uses public register + session apply + return path helpers", () => {
    expect(src).toContain("postRegister");
    expect(src).toContain("applyClientSessionAfterAuth");
    expect(src).toContain("safeInternalReturnPath");
    expect(src).toContain("resolveRegisterBackPath");
    expect(src).toContain("PENDING_GUIDE_KEY");
    expect(src).toContain("buildHeaderLoginHref");
  });

  it("active register forms avoid console light field shells", () => {
    const forms = [
      readFileSync(join(__dir, "RegisterTouristForm.tsx"), "utf8"),
      readFileSync(join(__dir, "RegisterGuideForm.tsx"), "utf8"),
      readFileSync(join(__dir, "useRegisterPage.ts"), "utf8"),
    ].join("\n");
    expect(forms).toContain("authL5FieldClass");
    expect(forms).not.toMatch(/border-ink-200[\s\S]{0,60}bg-bg-console/);
  });

  it("keeps Auth suspense shell and register DOM anchors", () => {
    expect(src).toContain("AuthFullBleedSearchParamsSuspense");
    expect(src).toContain('mainAriaLabelKey="auth_register_title"');
    expect(src).toContain('data-tt-auth-route="register"');
    expect(src).toContain('data-tt-auth-register-submit="1"');
  });

  it("page routes through RegisterPageMain with loginHref for footer Link", () => {
    const page = readFileSync(join(__dir, "page.tsx"), "utf8");
    const main = readFileSync(join(__dir, "RegisterPageMain.tsx"), "utf8");
    expect(page).toContain("RegisterPageMain");
    expect(main).toContain("loginHref={loginHref}");
    expect(main).toContain("useRegisterPage");
    const tourist = readFileSync(join(__dir, "RegisterTouristForm.tsx"), "utf8");
    expect(tourist).toContain("titleLogin");
    expect(tourist).toContain("preferCollapsedSummary");
  });
});
