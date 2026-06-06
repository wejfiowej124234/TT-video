import { describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";

import {
  isOnboardingStripeReturnQuery,
  onboardingReturnUrlForCheckout,
  parseOnboardingQuoteRoleParam,
  stripOnboardingStripeReturnQueryFromUrl,
} from "@/app/me/onboarding/meOnboardingPageHelpers";

describe("meOnboardingPage.contract (Auth/Identity phase ① · Console L5)", () => {
  it("parses ?role= for quote role SSOT", () => {
    expect(parseOnboardingQuoteRoleParam(null)).toBe("provider");
    expect(parseOnboardingQuoteRoleParam("provider")).toBe("provider");
    expect(parseOnboardingQuoteRoleParam("region_steward")).toBe("region_steward");
    expect(parseOnboardingQuoteRoleParam("guide")).toBe("provider");
  });

  it("page entry delegates to MeOnboardingPageMain with Suspense", () => {
    const page = fs.readFileSync(path.join(process.cwd(), "app/me/onboarding/page.tsx"), "utf8");
    expect(page).toContain("MeOnboardingPageMain");
    expect(page).toContain("Suspense");
    expect(page).not.toContain("postOnboardingPaymentIntent");
  });

  it("main shell uses Console L5 progress and attrs (not dark Auth progress bars)", () => {
    const main = fs.readFileSync(path.join(process.cwd(), "app/me/onboarding/MeOnboardingPageMain.tsx"), "utf8");
    const quote = fs.readFileSync(path.join(process.cwd(), "app/me/onboarding/MeOnboardingQuoteSection.tsx"), "utf8");
    const ent = fs.readFileSync(
      path.join(process.cwd(), "app/me/onboarding/MeOnboardingEntitlementsSection.tsx"),
      "utf8",
    );
    const writes = fs.readFileSync(path.join(process.cwd(), "app/me/onboarding/MeOnboardingWritesSection.tsx"), "utf8");
    expect(main).toContain("TT_ME_ONBOARDING_L5.pageAttrs");
    expect(main).toContain("MeOnboardingConsoleProgress");
    expect(main).toContain("MeOnboardingNextStep");
    expect(main).toContain("MeOnboardingDonePanel");
    expect(main).toContain("deriveOnboardingFlowPhase");
    expect(main).toContain("deriveOnboardingConsoleProgressStep");
    expect(main).not.toContain("ProviderOnboardingProgress");
    expect(main).not.toContain("StewardOnboardingProgress");
    expect(main).toContain("MeOnboardingWritesSection");
    expect(main).toContain("MeOnboardingStewardJourneyBridge");
    expect(main).toContain("MeOnboardingStewardStakeSection");
    expect(main).toContain("steward_register");
    expect(writes).toContain("data-tt-me-onboarding-steward-fee-clarify");
    expect(main).toContain("accountFooterLinkClass");
    expect(fs.readFileSync(path.join(process.cwd(), "app/me/onboarding/error.tsx"), "utf8")).toContain(
      "MeOnboardingRouteError",
    );
    expect(quote).toContain("MeOnboardingSummaryGrid");
    expect(quote).toContain("MeOnboardingTechnicalDetails");
    expect(quote).not.toMatch(/<pre[\s\S]*quoteJson/);
    expect(ent).toContain("MeOnboardingTechnicalDetails");
    expect(writes).toContain("MeOnboardingTechnicalDetails");
    expect(writes).not.toMatch(/<pre[\s\S]*payJson/);
    expect(writes).toContain("MeOnboardingLocalDevTools");
    expect(writes).toContain("data-tt-me-onboarding-pay-flow-steps");
  });

  it("hook syncs URL role and checkout return_url", () => {
    const main = fs.readFileSync(path.join(process.cwd(), "app/me/onboarding/MeOnboardingPageMain.tsx"), "utf8");
    const hook = fs.readFileSync(path.join(process.cwd(), "app/me/onboarding/useMeOnboardingPage.ts"), "utf8");
    expect(hook).toContain("useSearchParams");
    expect(hook).toContain("parseOnboardingQuoteRoleParam");
    expect(hook).toContain("onboardingReturnUrlForCheckout(quoteRole)");
    expect(hook).toContain("history.replaceState");
    expect(hook).toContain("isOnboardingStripeReturnQuery");
    expect(hook).toContain("entAutoSyncing");
    expect(hook).toContain("onboardingRoleConfirmedForQuote");
    expect(hook).toContain("traveltrust:profile-updated");
    expect(hook).toContain("useHeaderSession");
    expect(hook).toContain("sessionChecking");
    expect(hook).toContain("getMeFull");
    expect(hook).toContain("setEntJson(null)");
    expect(main).toContain("MeOnboardingWritesProbeShell");
    expect(main).toContain("MeOnboardingSessionContextBanner");
    expect(main).toContain("sessionChecking");
    expect(main).toContain("showWalletSessionHintInNextStep");
    expect(main).toContain("integrateWalletSessionInNextStep");
    expect(main).toContain("authReturnPath");
    expect(main).toContain("buildMeOnboardingAuthReturnPath");
    expect(main).toContain("isMeOnboardingGuestEntryAllowed");
    expect(main).toContain("needsLoginGate");
    expect(main).toContain("MeOnboardingGuestEntryNotice");
    expect(main).toContain("guestQuotePreview");
    expect(fs.readFileSync(path.join(process.cwd(), "app/me/onboarding/meOnboardingGuestAccess.ts"), "utf8")).toContain(
      "ME_ONBOARDING_GUEST_FROM_VALUES",
    );
    expect(main).toContain("useMeOnboardingClientWalletConnected");
    expect(fs.readFileSync(path.join(process.cwd(), "app/me/onboarding/useMeOnboardingClientWalletConnected.ts"), "utf8")).toContain(
      "mounted && isConnected",
    );
  });

  it("detects Stripe return query and strips sensitive params from URL", () => {
    const params = new URLSearchParams("session_id=cs_test_abc&role=region_steward");
    expect(isOnboardingStripeReturnQuery(params)).toBe(true);
    expect(isOnboardingStripeReturnQuery(new URLSearchParams("role=region_steward"))).toBe(false);

    const prev = global.window;
    // @ts-expect-error test shim
    global.window = {
      location: { href: "http://127.0.0.1:3012/me/onboarding?session_id=x&role=region_steward" },
      history: { replaceState: vi.fn() },
    };
    expect(stripOnboardingStripeReturnQueryFromUrl()).toBe(true);
    // @ts-expect-error test shim
    expect(global.window.history.replaceState).toHaveBeenCalled();
    global.window = prev;
  });

  it("checkout return_url preserves steward deep link", () => {
    const prev = global.window;
    // @ts-expect-error test shim
    global.window = { location: { origin: "http://127.0.0.1:3012" } };
    expect(onboardingReturnUrlForCheckout("provider")).toBe("http://127.0.0.1:3012/me/onboarding");
    expect(onboardingReturnUrlForCheckout("region_steward")).toBe(
      "http://127.0.0.1:3012/me/onboarding?role=region_steward",
    );
    global.window = prev;
  });
});
