import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const PAGE = join(ROOT, "app/steward/register/StewardRegisterPageMain.tsx");
const FORM = join(ROOT, "app/steward/register/StewardRegisterMainForm.tsx");
const CONTEXT = join(ROOT, "app/steward/register/StewardRegisterContextBanners.tsx");
const WIZARD = join(ROOT, "components/steward/StewardRegisterWizardProgress.tsx");
const L5 = join(ROOT, "lib/steward/stewardRegisterL5.ts");
const FREEZE = join(ROOT, "evidence/GO_local_steward_register_closure/STEWARD-REGISTER-UI-FREEZE.md");

const WALLET = join(ROOT, "app/steward/register/StewardRegisterWalletSection.tsx");

const FORBIDDEN: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\btext-ink-\d/, reason: "mixed ink neutral tokens" },
  { pattern: /\bbg-bg-main\b/, reason: "console light shell" },
  { pattern: /MarketDarkRouteSceneDecor/, reason: "market photo decor" },
  { pattern: /\bref-cyan\b/, reason: "market cyan chrome" },
  { pattern: /\/auth\/register\?role=steward/, reason: "raw URL in user-facing shell" },
];

describe("stewardRegister UI freeze (① · STEWARD-REGISTER-UI-FREEZE)", () => {
  it("freeze doc and machine anchors exist", () => {
    const doc = readFileSync(FREEZE, "utf8");
    expect(doc).toContain("2026-05-27");
    expect(doc).toContain("data-tt-steward-register-ui-frozen");
    expect(doc).toContain("StewardRegisterWizardProgress");
    const l5 = readFileSync(L5, "utf8");
    expect(l5).toContain("data-tt-steward-register-ui-frozen");
    expect(l5).toContain("min-h-[44px]");
    expect(l5).toContain("ctaBlockedHint");
    expect(l5).toContain("walletStepShell");
    expect(l5).not.toContain("uppercase");
  });

  it("shell uses Auth L5 dual progress and hub kicker", () => {
    const page = readFileSync(PAGE, "utf8");
    expect(page).toContain("AuthL5PageBackdrop");
    expect(page).toContain("AuthL5Card");
    expect(page).toContain('variant="compact"');
    expect(page).toContain("hideFeeRouterLinks");
    expect(page).toContain("stewardRegister_hubKicker");
    expect(page).toContain("StewardRegisterContextBanners");
    expect(page).toContain("AuthL5CrossNavFooter");
    expect(page).toContain("stewardRegisterL5MainDataAttrs");
  });

  it("route segment loading and error stay on L5 shell", () => {
    const loading = readFileSync(join(ROOT, "app/steward/register/loading.tsx"), "utf8");
    const error = readFileSync(join(ROOT, "app/steward/register/error.tsx"), "utf8");
    expect(loading).toContain("AuthRouteLoading");
    expect(error).toContain("AuthRouteErrorShell");
  });

  it("form uses wizard progress, wallet flow, and jurisdiction empty hint", () => {
    const form = readFileSync(FORM, "utf8");
    expect(form).toContain("StewardRegisterWizardProgress");
    expect(form).toContain("StewardRegisterWalletSection");
    expect(form).toContain("primaryCtaSpinner");
    expect(form).toContain("autoComplete");
    expect(readFileSync(WALLET, "utf8")).toContain("walletStepShell");
    expect(form).toContain("stewardRegister_jurisdictionEmptyHint");
    expect(form).toContain('className="sr-only"');
    expect(form).toContain("step1Blocked");
    expect(form).toContain("data-tt-steward-register-step");
    expect(form).toContain("formatStewardCumulativeStakeDisplay");
    expect(form).toContain("primaryCtaMuted");
    expect(form).toContain("formatStewardEmptyStakePreview");
    expect(form).toContain("stewardRegister_ctaBlockedStep1");
    expect(form).not.toMatch(/\bbps\b/);
  });

  it("wizard progress uses warm-gold done state without duplicate heading", () => {
    const wizard = readFileSync(WIZARD, "utf8");
    expect(wizard).not.toContain("stewardRegister_formProgressHeading");
    expect(wizard).not.toContain("travel-600");
    expect(wizard).toContain("ref-sun");
  });

  it("context banners fold trust growth behind details summary", () => {
    const ctx = readFileSync(CONTEXT, "utf8");
    expect(ctx).toContain("<details");
    expect(ctx).toContain("stewardRegister_contextSummary");
    expect(ctx).toContain('moment="steward_apply"');
  });

  it("logged-out journey progress starts at step 1 with role-specific login gate copy", () => {
    const page = readFileSync(PAGE, "utf8");
    expect(page).toContain("TT_AUTH_REGISTER_FLOW_L5");
    expect(page).toContain("stewardRegister_loginGateTitle");
    expect(page).not.toContain('currentStep={2}');
    expect(page).toContain("isLoggedIn === true && meCheckReady ? 2 : 1");
    expect(readFileSync(join(ROOT, "app/guide/register/GuideRegisterLoginGate.tsx"), "utf8")).toContain(
      "registerFlow_walletSessionHint",
    );
  });

  it("pending and rejected panels require account session", () => {
    const page = readFileSync(PAGE, "utf8");
    const hook = readFileSync(join(ROOT, "app/steward/register/useStewardRegisterPage.ts"), "utf8");
    const session = readFileSync(join(ROOT, "lib/auth/accountSessionProbe.ts"), "utf8");
    expect(page).toContain("isPending && !done && isLoggedIn === true");
    expect(page).toContain("showRejectedGate && isLoggedIn === true");
    expect(hook).toContain("setIsPending(false)");
    expect(hook).toContain("useRegisterPageAccountSession");
    expect(session).toContain("traveltrust:auth-change");
    expect(session).toContain("clearGetMeCache");
  });

  it("forbids L5 regressions in steward register shell", () => {
    const src = [PAGE, FORM, WALLET, readFileSync(WIZARD, "utf8"), readFileSync(join(ROOT, "components/steward/StewardOnboardingProgress.tsx"), "utf8")].join("\n");
    for (const { pattern, reason } of FORBIDDEN) {
      expect(src, reason).not.toMatch(pattern);
    }
  });
});
