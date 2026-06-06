import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "..", "..");

describe("providerRegisterL5 contract", () => {
  it("exports L5 shell tokens and data attrs", () => {
    const src = readFileSync(join(root, "lib/provider/providerRegisterL5.ts"), "utf8");
    expect(src).toContain("TT_PROVIDER_REGISTER_L5");
    expect(src).toContain("data-tt-provider-register-l5");
    expect(src).toContain("TT_AUTH_L5_PAGE_SHELL_GUIDE");
  });

  it("ProviderOnboardingProgress supports compact rail like steward", () => {
    const progress = readFileSync(join(root, "components/provider/ProviderOnboardingProgress.tsx"), "utf8");
    expect(progress).toContain("OnboardingProgressCompactRail");
    expect(progress).toContain('variant?: "full" | "compact"');
    expect(readFileSync(join(root, "app/provider/register/ProviderRegisterPendingPanel.tsx"), "utf8")).toContain(
      'variant="compact"',
    );
    expect(readFileSync(join(root, "app/provider/register/ProviderRegisterPendingPanel.tsx"), "utf8")).toContain(
      "meOnboardingHref",
    );
  });

  it("provider register syncs account session with header on logout", () => {
    const hook = readFileSync(join(root, "app/provider/register/useProviderRegisterPage.ts"), "utf8");
    const page = readFileSync(join(root, "app/provider/register/ProviderRegisterPageMain.tsx"), "utf8");
    expect(hook).toContain("useRegisterPageAccountSession");
    expect(hook).toContain("setIsPending(false)");
    expect(page).toContain("isPending && !done && isLoggedIn === true");
  });

  it("ProviderRegisterPageMain uses L5 attrs", () => {
    const src = readFileSync(
      join(root, "app/provider/register/ProviderRegisterPageMain.tsx"),
      "utf8",
    );
    expect(src).toContain("providerRegisterL5MainDataAttrs");
    expect(src).toContain("ProviderOnboardingProgress");
    expect(src).toContain("providerRegister_loginGateTitle");
    expect(src).toContain("providerRegister_hubKicker");
    expect(src).toContain("isLoggedIn === true && meCheckReady ? 2 : 1");
    expect(readFileSync(join(root, "app/provider/register/ProviderRegisterPendingPanel.tsx"), "utf8")).toContain(
      "hideFeeRouterLinks",
    );
  });
});
