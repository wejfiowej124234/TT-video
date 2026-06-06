import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const MAIN = join(ROOT, "app/me/onboarding/MeOnboardingPageMain.tsx");
const QUOTE = join(ROOT, "app/me/onboarding/MeOnboardingQuoteSection.tsx");
const ENT = join(ROOT, "app/me/onboarding/MeOnboardingEntitlementsSection.tsx");
const WRITES = join(ROOT, "app/me/onboarding/MeOnboardingWritesSection.tsx");
const LOADING = join(ROOT, "app/me/onboarding/loading.tsx");
const ERROR = join(ROOT, "app/me/onboarding/error.tsx");
const L5 = join(ROOT, "lib/me/meOnboardingL5.ts");
const FREEZE = join(ROOT, "evidence/GO_local_auth_l5/ME-ONBOARDING-CONSOLE-L5-FREEZE.md");
const ROUTE_ERROR = join(ROOT, "components/me/MeOnboardingRouteError.tsx");

const FORBIDDEN: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\bAuthL5PageBackdrop\b/, reason: "Auth L5 dark backdrop on Console onboarding" },
  { pattern: /\bAuthL5Card\b/, reason: "Auth L5 card on Console onboarding" },
  { pattern: /\bProviderOnboardingProgress\b/, reason: "dark provider progress bar" },
  { pattern: /\bStewardOnboardingProgress\b/, reason: "dark steward progress bar" },
  { pattern: /<pre[\s\S]*JSON\.stringify\(quoteJson/, reason: "raw quote JSON as primary UI" },
  { pattern: /<pre[\s\S]*JSON\.stringify\(entJson/, reason: "raw entitlements JSON as primary UI" },
  { pattern: /<pre[\s\S]*JSON\.stringify\(payJson/, reason: "raw payment JSON as primary UI" },
  { pattern: /<pre[\s\S]*JSON\.stringify\(roleJson/, reason: "raw role confirm JSON as primary UI" },
];

describe("meOnboarding UI freeze (① · ME-ONBOARDING-CONSOLE-L5-FREEZE)", () => {
  it("freeze doc and machine anchors exist", () => {
    const doc = readFileSync(FREEZE, "utf8");
    expect(doc).toContain("2026-05-28");
    expect(doc).toContain("data-tt-me-onboarding-ui-frozen");
    expect(doc).toContain("MeOnboardingConsoleProgress");
    const l5 = readFileSync(L5, "utf8");
    expect(l5).toContain("data-tt-me-onboarding-console-l5");
    expect(l5).toContain("data-tt-me-onboarding-ui-frozen");
  });

  it("main shell uses Console L5 progress, summary primitives, and warm footer links", () => {
    const main = readFileSync(MAIN, "utf8");
    expect(main).toContain("MeOnboardingConsoleProgress");
    expect(main).toContain("TT_ME_ONBOARDING_L5.pageAttrs");
    expect(main).toContain("MeOnboardingNextStep");
    expect(main).toContain("MeOnboardingDonePanel");
    expect(main).toContain("meOnboardingDevUiEnabled");
    expect(main).not.toContain("ProviderOnboardingProgress");
    expect(main).not.toContain("StewardOnboardingProgress");
  });

  it("sections use summary grid and collapsible technical JSON", () => {
    const main = readFileSync(MAIN, "utf8");
    const quote = readFileSync(QUOTE, "utf8");
    const ent = readFileSync(ENT, "utf8");
    const writes = readFileSync(WRITES, "utf8");
    expect(quote).toContain("MeOnboardingSummaryGrid");
    expect(quote).toContain("MeOnboardingTechnicalDetails");
    expect(ent).toContain("MeOnboardingTechnicalDetails");
    expect(writes).toContain("MeOnboardingTechnicalDetails");
    expect(writes).toContain("MeOnboardingLocalDevTools");
    expect(writes).toContain("MeOnboardingWritesStageRail");
    expect(main).toContain("MeOnboardingWritesLoginGate");
    expect(readFileSync(join(ROOT, "app/me/onboarding/MeOnboardingRolePick.tsx"), "utf8")).toContain(
      "rolePillSelected",
    );
    expect(readFileSync(join(ROOT, "components/me/MeOnboardingConsoleProgress.tsx"), "utf8")).toContain(
      "OnboardingProgressCompactRail",
    );
    expect(readFileSync(join(ROOT, "components/steward/StewardOnboardingProgress.tsx"), "utf8")).toContain(
      "OnboardingProgressCompactRail",
    );
    const quoteSection = readFileSync(join(ROOT, "app/me/onboarding/MeOnboardingQuoteSection.tsx"), "utf8");
    expect(quoteSection).toContain("ME_ONBOARDING_SECTION_CARD_CLASS");
    expect(quoteSection).toContain("formatOnboardingQuoteExpiresAtUtc");
    expect(quoteSection).not.toContain("toLocaleString");
    const progress = readFileSync(join(ROOT, "components/me/MeOnboardingConsoleProgress.tsx"), "utf8");
    expect(progress).toContain("guestQuotePreview");
    const vm = readFileSync(join(ROOT, "lib/me/meOnboardingViewModel.ts"), "utf8");
    expect(vm).toContain('new Intl.NumberFormat("en-US"');
    expect(vm).not.toMatch(/NumberFormat\(undefined/);
  });

  it("route segment loading and error stay on Console account shell", () => {
    expect(readFileSync(LOADING, "utf8")).toContain("TT_ME_ONBOARDING_L5.pageAttrs");
    expect(readFileSync(ERROR, "utf8")).toContain("MeOnboardingRouteError");
    expect(readFileSync(ROUTE_ERROR, "utf8")).toContain("TT_MARKETING_ACCOUNT_ERROR_MAIN");
    expect(readFileSync(ROUTE_ERROR, "utf8")).not.toContain("AuthL5PageBackdrop");
  });

  it("logged-out: single login CTA, wallet integrated card, locked sections without defer", () => {
    const main = readFileSync(MAIN, "utf8");
    const next = readFileSync(join(ROOT, "components/me/MeOnboardingNextStep.tsx"), "utf8");
    const ent = readFileSync(ENT, "utf8");
    const gate = readFileSync(join(ROOT, "app/me/onboarding/MeOnboardingWritesLoginGate.tsx"), "utf8");
    const banner = readFileSync(join(ROOT, "app/me/onboarding/MeOnboardingSessionContextBanner.tsx"), "utf8");
    const locked = readFileSync(join(ROOT, "components/me/MeOnboardingSectionLockedState.tsx"), "utf8");
    const l5 = readFileSync(L5, "utf8");
    expect(main).toContain("MeOnboardingSessionContextBanner");
    expect(main).toContain("integrateWalletSession");
    expect(banner).toContain('data-tt-me-onboarding-session-banner="checking"');
    expect(banner).not.toContain("wallet_account_split");
    expect(next).toContain("login_wallet_integrated");
    expect(next).toContain("nextStepShellIntegrated");
    expect(next).toContain("ME_ONBOARDING_LOGIN_CTA_ID");
    expect(next).toContain("me_onboarding_goLogin");
    expect(next).toContain("integrateWalletSession");
    expect(ent).toContain("MeOnboardingSectionLockedState");
    expect(ent).not.toContain("me_onboarding_loginGateDeferCta");
    expect(gate).not.toContain("me_onboarding_loginGateDeferCta");
    expect(locked).not.toContain("me_onboarding_loginGateDeferCta");
    expect(locked).toContain("me_onboarding_sectionLockedSrHint");
    expect(l5).toContain("amountHeroValueDemo");
    expect(l5).toContain("amountHeroDemo");
    expect(l5).toContain("nextStepShellIntegrated");
  });

  it("writes login gate defers to NextStep (no duplicate register CTA)", () => {
    const gate = readFileSync(join(ROOT, "app/me/onboarding/MeOnboardingWritesLoginGate.tsx"), "utf8");
    const next = readFileSync(join(ROOT, "components/me/MeOnboardingNextStep.tsx"), "utf8");
    expect(gate).toContain("MeOnboardingSectionLockedState");
    expect(gate).not.toContain("meOnboardingRegisterHref");
    expect(next).toContain("authReturnPath");
    expect(next).toContain("meOnboardingRegisterHref");
  });

  it("session probe aligns with header SSOT (no login gate while checking)", () => {
    const main = readFileSync(MAIN, "utf8");
    const hook = readFileSync(join(ROOT, "app/me/onboarding/useMeOnboardingPage.ts"), "utf8");
    const next = readFileSync(join(ROOT, "components/me/MeOnboardingNextStep.tsx"), "utf8");
    const ent = readFileSync(ENT, "utf8");
    const banner = readFileSync(join(ROOT, "app/me/onboarding/MeOnboardingSessionContextBanner.tsx"), "utf8");
    expect(hook).toContain("useHeaderSession");
    expect(hook).toContain("sessionChecking");
    expect(main).toContain("MeOnboardingWritesProbeShell");
    expect(readFileSync(join(ROOT, "app/me/onboarding/MeOnboardingWritesProbeShell.tsx"), "utf8")).toContain(
      "data-tt-me-onboarding-writes-session-probe",
    );
    expect(next).toContain("if (sessionChecking)");
    expect(banner).toContain("me_onboarding_sessionBannerCheckingTitle");
    expect(ent).toContain("me_onboarding_sessionCheckingTitle");
    expect(readFileSync(L5, "utf8")).toContain("sessionProbeBanner");
  });

  it("P1: entitlements syncing, confirm lock, and steward pending bridge", () => {
    const main = readFileSync(MAIN, "utf8");
    const ent = readFileSync(ENT, "utf8");
    const writes = readFileSync(WRITES, "utf8");
    const l5 = readFileSync(L5, "utf8");
    expect(main).toContain("MeOnboardingStewardJourneyBridge");
    expect(main).toContain("entitlementsSyncing");
    expect(main).toContain("steward_register");
    expect(main).toContain("steward_pending");
    expect(ent).toContain("entitlementsSyncingShell");
    expect(ent).toContain("me_onboarding_entitlementsAwaitingPaymentTitle");
    expect(writes).toContain("actionPrimaryLocked");
    expect(writes).toContain("confirmBlockedCallout");
    expect(writes).toContain("me_onboarding_confirmLockedBadge");
    expect(l5).toContain("actionPrimaryLocked");
    expect(readFileSync(join(ROOT, "app/steward/register/StewardRegisterPendingPanel.tsx"), "utf8")).toContain(
      'from: "steward_pending"',
    );
  });

  it("enterprise guest gate: chain from= required for logged-out entry", () => {
    const main = readFileSync(MAIN, "utf8");
    const guest = readFileSync(join(ROOT, "app/me/onboarding/meOnboardingGuestAccess.ts"), "utf8");
    expect(main).toContain("needsLoginGate");
    expect(main).toContain("guestEntryAllowed");
    expect(main).toContain("guestQuotePreview");
    expect(main).toContain("deriveOnboardingGuestPreviewProgressStep");
    expect(main).toContain("data-tt-me-onboarding-gate-redirect");
    expect(main).toContain("isMeOnboardingGuestEntryAllowed");
    expect(guest).toContain("identities_hub");
    expect(readFileSync(join(ROOT, "app/me/onboarding/MeOnboardingGuestEntryNotice.tsx"), "utf8")).toContain(
      "me_onboarding_guestEntry_",
    );
  });

  it("logged-in pay phase uses compact next-step (no duplicate body vs writes primary CTA)", () => {
    const next = readFileSync(join(ROOT, "components/me/MeOnboardingNextStep.tsx"), "utf8");
    const ent = readFileSync(ENT, "utf8");
    expect(next).toContain("LOGGED_IN_COMPACT_PHASES");
    expect(next).toContain("_compact");
    expect(next).toContain("journeyBridge");
    expect(ent).toContain("data-tt-me-onboarding-entitlements-awaiting");
    expect(ent).toContain("me_onboarding_entitlementsAwaitingBadge");
  });

  it("forbids Console L5 regressions in onboarding shell", () => {
    const src = [MAIN, QUOTE, ENT, WRITES].join("\n");
    for (const { pattern, reason } of FORBIDDEN) {
      expect(src, reason).not.toMatch(pattern);
    }
  });
});
