import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REGISTER_DIR = join(process.cwd(), "app", "auth", "register");

function readRegisterFormSources(): string {
  return [
    "RegisterTouristForm.tsx",
    "RegisterGuideForm.tsx",
    "RegisterPageMain.tsx",
    "useRegisterPage.ts",
    "registerBackgrounds.ts",
    "page.tsx",
  ]
    .map((f) => readFileSync(join(REGISTER_DIR, f), "utf8"))
    .join("\n");
}

describe("/auth/register L5 shell (contract)", () => {
  const src = readRegisterFormSources();

  it("uses Auth L5 backdrop instead of register stock photos", () => {
    expect(src).toContain("AuthL5PageBackdrop");
    expect(src).toContain('data-tt-auth-visual="l5"');
    expect(src).not.toContain("<RegisterPageBackdrop");
  });

  it("uses shared auth L5 page shell tokens", () => {
    expect(src).toContain("TT_AUTH_L5_PAGE_SHELL");
    expect(src).toContain("AuthL5CrossNavFooter");
  });

  it("uses dark L5 glass cards (not console white shell)", () => {
    expect(src).toContain("AuthL5Card");
    expect(src).toContain("TT_AUTH_L5_FORM");
    expect(src).toContain("authL5FieldClass");
    expect(src).not.toMatch(/border-ink-200[\s\S]{0,80}bg-bg-console/);
    expect(src).not.toMatch(/bg-travel-500/);
    expect(src).toContain('surface="l5"');
    expect(src).toContain('TrustGrowthMomentBanner moment="register" surface="l5"');
    expect(src).toContain("preferCollapsedSummary");
    expect(src).toContain("titleLogin");
    expect(src).toContain('data-tt-auth-register-ui-frozen="1"');
    expect(readFileSync(join(process.cwd(), "components", "trust", "TrustGrowthMomentBanner.tsx"), "utf8")).toContain(
      "auth-l5-trust-growth-banner",
    );
    expect(src).toContain("AuthL5Checkbox");
  });

  it("keeps register form anchors", () => {
    expect(src).toContain('data-tt-auth-route="register"');
    expect(src).toContain('data-tt-auth-register-submit="1"');
  });
});
