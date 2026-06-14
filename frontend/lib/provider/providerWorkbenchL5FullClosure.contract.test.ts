import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import zh from "@/locales/zh";
import en from "@/locales/en";
import {
  PROVIDER_WORKBENCH_L5_BANNED_COPY,
  PROVIDER_WORKBENCH_L5_CLOSURE_FINDINGS,
  PROVIDER_WORKBENCH_L5_LOCALE_KEYS,
  PROVIDER_WORKBENCH_L5_OPEN_P0,
  PROVIDER_WORKBENCH_L5_OPEN_P1,
  PROVIDER_WORKBENCH_PAGE_L5_CLOSURE_PROBE,
  PROVIDER_WORKBENCH_PAGE_L5_FROZEN_MARKER,
  PROVIDER_WORKBENCH_PAGE_L5_UI_FROZEN,
} from "./providerWorkbenchL5ClosureSprintModel";

const root = join(process.cwd());

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("provider workbench L5 full closure (① local · frozen)", () => {
  it("freeze doc is ACTIVE and P0/P1 closed", () => {
    const freeze = read("evidence/GO_local_provider_workbench_l5/PROVIDER-WORKBENCH-L5-FREEZE.md");
    expect(freeze).toContain("冻结结论（ACTIVE）");
    expect(PROVIDER_WORKBENCH_PAGE_L5_UI_FROZEN).toBe(true);
    expect(PROVIDER_WORKBENCH_L5_OPEN_P0).toHaveLength(0);
    expect(PROVIDER_WORKBENCH_L5_OPEN_P1).toHaveLength(0);
    expect(PROVIDER_WORKBENCH_L5_CLOSURE_FINDINGS.filter((f) => f.status === "open")).toHaveLength(0);
  });

  it("locale keys exist and avoid banned copy", () => {
    for (const key of PROVIDER_WORKBENCH_L5_LOCALE_KEYS) {
      const zhVal = (zh as Record<string, string>)[key];
      const enVal = (en as Record<string, string>)[key];
      expect(zhVal, `zh:${key}`).toBeTruthy();
      expect(enVal, `en:${key}`).toBeTruthy();
      expect(zhVal).not.toMatch(PROVIDER_WORKBENCH_L5_BANNED_COPY);
      expect(enVal).not.toMatch(PROVIDER_WORKBENCH_L5_BANNED_COPY);
    }
  });

  it("page wires ops scope, market exposure, stats teaser, trust link", () => {
    const page = read("app/provider/page.tsx");
    expect(page).toContain("MERCHANT_WORKSPACE_OPS_SCOPE_MARKER");
    expect(page).toContain("MerchantWorkbenchMarketExposureCard");
    expect(page).toContain("ProviderWorkbenchStatsTeaser");
    expect(page).toContain("ProviderWorkbenchL5CrossNav");
    expect(page).toContain("resolveMerchantInboxEmptyGuidance");
    expect(page).toContain("statsLoading");
    expect(page).not.toContain("ProviderWorkbenchShowcaseSection");

    const exposure = read("components/provider/MerchantWorkbenchMarketExposureCard.tsx");
    expect(exposure).toContain("ProviderWorkbenchTrustAdmissionLink");
    expect(exposure).not.toContain("provider_workbench_browse_showcase");
    expect(exposure).not.toContain("merchantPublicShowcaseHref");
    expect(exposure).toContain("data-tt-provider-workbench-profile-missing");
    expect(exposure).toContain("data-tt-provider-workbench-publish-gate");
    expect(exposure).toContain("previewOnly");
    expect(exposure).not.toContain("onListingOpen");
    expect(exposure).not.toContain("useRouter");
    expect(PROVIDER_WORKBENCH_PAGE_L5_FROZEN_MARKER).toBe("provider-workbench-l5-20260612");

    const settings = read("app/me/identities/merchant/settings/MeMerchantProfileSettingsPageInner.tsx");
    expect(settings).toContain("fromProviderWorkbench");
    expect(settings).toContain("isDirty");
    expect(settings).toContain("!fromProviderWorkbench && !formReadOnly && isDirty");

    const billing = read("components/provider/ProviderWorkbenchBillingPeriodCard.tsx");
    expect(billing).not.toContain("merchantProfileSettingsHrefFromWorkbench");
  });

  it("smoke + seed scripts reference merchant@test.com", () => {
    const smoke = readFileSync(join(root, "..", "scripts", "dev", "smoke-provider-workbench-l5-local.sh"), "utf8");
    expect(smoke).toContain("merchant@test.com");
    const auth = readFileSync(join(root, "..", "crates", "api", "src", "chain_off", "auth.rs"), "utf8");
    expect(auth).toContain("seed_merchant_workbench_demo_accounts");
  });

  it("settings href SSOT and merchant orders view-all corridor (regression)", () => {
    const nav = read("lib/provider/merchantProfileSettingsNav.ts");
    expect(nav).toContain("meIdentitiesCoreCardModel");
    expect(nav).not.toContain("meIdentitiesProfileLinksModel");

    const header = read("app/orders/OrdersListPageHeader.tsx");
    const empty = read("app/orders/OrdersListEmptyState.tsx");
    const mobile = read("app/orders/OrdersListMobileActionBar.tsx");
    expect(header).toContain("workspaceOrdersViewAllHref");
    expect(empty).toContain("workspaceOrdersViewAllHref");
    expect(mobile).toContain("workspaceOrdersViewAllHref");
    expect(empty).toContain("showViewAllOrdersCta");
  });
});
