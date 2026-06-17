import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { formatStewardCumulativeStakeDisplay, formatStewardEmptyStakePreview } from "@/lib/steward/stewardRegisterL5";

const ROOT = process.cwd();
const PAGE = join(ROOT, "app/steward/register/StewardRegisterPageMain.tsx");
const FORM = join(ROOT, "app/steward/register/StewardRegisterMainForm.tsx");
const CONTEXT = join(ROOT, "app/steward/register/StewardRegisterContextBanners.tsx");
const PENDING = join(ROOT, "app/steward/register/StewardRegisterPendingPanel.tsx");
const STATUS = join(ROOT, "app/steward/register/StewardRegisterStatusPanels.tsx");
const CROSS_NAV = join(ROOT, "components/auth/AuthShellCrossNav.tsx");
const HOOK = join(ROOT, "app/steward/register/useStewardRegisterPage.ts");
const ZH = join(ROOT, "locales/zh.ts");

describe("steward register L5 full-score polish (①)", () => {
  it("formats cumulative stake without bps jargon", () => {
    expect(formatStewardCumulativeStakeDisplay(400, 40_000_000)).toBe("4% · 40,000,000 TTG");
    expect(formatStewardCumulativeStakeDisplay(450, 4_500_000)).toBe("4.5% · 4,500,000 TTG");
  });

  it("form shell avoids user-facing bps strings and uses muted blocked CTA", () => {
    const form = readFileSync(FORM, "utf8");
    expect(form).toContain("formatStewardCumulativeStakeDisplay");
    expect(form).toContain("formatStewardEmptyStakePreview");
    expect(form).toContain("submitBlocked");
    expect(form).toContain("stewardRegister_chainStakeChecking");
    const l5 = readFileSync(join(ROOT, "lib/steward/stewardRegisterL5.ts"), "utf8");
    expect(l5).toContain("border-slate-600/55");
    expect(form).not.toMatch(/\bbps\b/);
  });

  it("page wires context banners, wizard hint, and fee-router-free footer", () => {
    const page = readFileSync(PAGE, "utf8");
    expect(page).toContain("StewardRegisterContextBanners");
    expect(page).toContain("wizardStep=");
    expect(page).toContain("hideFeeRouterLinks");
    const ctx = readFileSync(CONTEXT, "utf8");
    expect(ctx).toContain("<details");
    expect(ctx).toContain('moment="steward_apply"');
  });

  it("AuthShellCrossNav forwards hideFeeRouterLinks to ProductCrossNav", () => {
    const src = readFileSync(CROSS_NAV, "utf8");
    expect(src).toContain("hideFeeRouterLinks");
    expect(src).toMatch(/hideFeeRouterLinks=\{hideFeeRouterLinks\}/);
  });

  it("pending and done panels use compact journey progress and L5 ink tokens", () => {
    expect(readFileSync(PENDING, "utf8")).toContain('variant="compact"');
    expect(readFileSync(PENDING, "utf8")).toContain("hideFeeRouterLinks");
    expect(readFileSync(PENDING, "utf8")).toContain("TT_AUTH_REGISTER_FLOW_L5.pendingStatusSection");
    expect(readFileSync(PENDING, "utf8")).toContain("text-slate-100");
    expect(readFileSync(join(ROOT, "app/provider/register/ProviderRegisterPendingPanel.tsx"), "utf8")).toContain(
      'variant="compact"',
    );
    expect(readFileSync(join(ROOT, "app/provider/register/ProviderRegisterPendingPanel.tsx"), "utf8")).toContain(
      "TT_AUTH_REGISTER_FLOW_L5.pendingStatusSection",
    );
    const status = readFileSync(STATUS, "utf8");
    expect(status).toContain('variant="compact"');
    expect(status).toContain("text-slate-100");
    expect(status).not.toContain("text-travel-500");
    expect(status).not.toContain("text-ink-100");
  });

  it("formats empty stake preview as zero state", () => {
    expect(formatStewardEmptyStakePreview()).toBe("0% · 0 TTG");
  });

  it("hook clamps URL step deep links to reachable wizard step", () => {
    const hook = readFileSync(HOOK, "utf8");
    expect(hook).toContain("clampStewardRegisterStep");
    expect(hook).toContain("stewardRegisterValidationFailureFromCode");
  });

  it("journey progress uses connected step list with badge labels", () => {
    const progress = readFileSync(join(ROOT, "components/steward/StewardOnboardingProgress.tsx"), "utf8");
    expect(progress).toContain("OnboardingProgressStepList");
    expect(readFileSync(join(ROOT, "components/onboarding/OnboardingStepIndexBadge.tsx"), "utf8")).toContain(
      "onboardingStepBadgeLabel",
    );
    expect(progress).not.toMatch(/done \? "✓"/);
  });

  it("wizard progress uses horizontal connectors between steps", () => {
    const wizard = readFileSync(join(ROOT, "components/steward/StewardRegisterWizardProgress.tsx"), "utf8");
    expect(wizard).toContain("onboardingProgressConnectorHorizontalClass");
  });

  it("rejected gate includes fee-router-free footer", () => {
    const page = readFileSync(PAGE, "utf8");
    expect(page).toMatch(/showRejectedGate[\s\S]*hideFeeRouterLinks/);
  });

  it("zh locale uses Chinese eyebrow and dual-step hint", () => {
    const zh = readFileSync(ZH, "utf8");
    expect(zh).toContain('stewardRegister_eyebrow: "区域主理人 · 治理"');
    expect(zh).toContain('stewardProgress_dualStepHint: "全链路第');
    expect(zh).toContain("stewardProgress_journeyLoginDoneNote");
    expect(zh).toContain("stewardRegister_ctaBlockedStep1");
    expect(zh).not.toMatch(/steward_register_jurisdictions:.*bps/);
    const jurisdictionEmptyHint = zh.match(
      /stewardRegister_jurisdictionEmptyHint:\s*\n\s*"([^"]*)"/,
    )?.[1];
    expect(jurisdictionEmptyHint ?? "").not.toMatch(/bps/);
  });
});
