import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveRegisterBackPath } from "@/app/auth/register/registerPageModel";
import { ME_SETTINGS_HUB_PATH } from "@/lib/me/meSettingsL5";

const ROOT = process.cwd();

describe("me settings register extension (①)", () => {
  it("resolveRegisterBackPath prefers settings hub when fromSettings", () => {
    expect(resolveRegisterBackPath(null, "provider", { fromSettings: true })).toBe(ME_SETTINGS_HUB_PATH);
    expect(resolveRegisterBackPath("/me/identities", "steward", { fromSettings: true })).toBe(
      ME_SETTINGS_HUB_PATH,
    );
  });

  it("provider register wires settings ingress", () => {
    const main = readFileSync(join(ROOT, "app/provider/register/ProviderRegisterPageMain.tsx"), "utf8");
    const hook = readFileSync(join(ROOT, "app/provider/register/useProviderRegisterPage.ts"), "utf8");
    expect(main).toContain("data-tt-provider-register-from-settings");
    expect(main).toContain("MeSettingsExtensionIngressBlock");
    expect(hook).toContain("fromSettings");
    expect(hook).toContain("{ fromSettings }");
  });

  it("steward register wires settings ingress", () => {
    const main = readFileSync(join(ROOT, "app/steward/register/StewardRegisterPageMain.tsx"), "utf8");
    expect(main).toContain("data-tt-steward-register-from-settings");
    expect(main).toContain("me_settings_steward_register_from_settings_notice");
  });

  it("guide dashboard wires settings ingress", () => {
    const page = readFileSync(join(ROOT, "app/guide/page.tsx"), "utf8");
    expect(page).toContain("data-tt-guide-from-settings");
    expect(page).toContain("ME_SETTINGS_PROFILE_PATH");
    const nav = readFileSync(join(ROOT, "lib/me/meSettingsNavModel.ts"), "utf8");
    expect(nav).toContain('meSettingsNavExtensionHref("/guide")');
  });

  it("onboarding from settings uses MeSettingsL5FlowPage without ProductCrossNav", () => {
    const page = readFileSync(join(ROOT, "app/me/onboarding/MeOnboardingPageMain.tsx"), "utf8");
    expect(page).toContain("data-tt-me-onboarding-from-settings");
    expect(page).toContain('data-tt-me-settings-route": "onboarding"');
    expect(page).toContain("!fromSettings");
    expect(page).toContain("needsLoginGate");
    expect(page).toContain("pendingSessionGate");
    expect(page).toContain("MeSettingsL5FlowPage");
    const nav = readFileSync(join(ROOT, "lib/me/meSettingsNavModel.ts"), "utf8");
    expect(nav).not.toContain("/me/onboarding?from=settings");
  });

  it("steward register hook passes fromSettings to resolveRegisterBackPath", () => {
    const hook = readFileSync(join(ROOT, "app/steward/register/useStewardRegisterPage.ts"), "utf8");
    expect(hook).toContain("fromSettings");
    expect(hook).toContain("{ fromSettings }");
  });
});
