import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MERCHANT_STUDIO_HREF } from "@/lib/workspace/workspaceIdentityModel";

const root = join(process.cwd());

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("providerWorkbench (① · merchant operator UX)", () => {
  it("studio deep link opens showcase modal via query param", () => {
    expect(MERCHANT_STUDIO_HREF).toBe("/market/provider?studio=1");
    const hook = read("components/market/useMarketStandaloneBusinessPage.ts");
    expect(hook).toContain('searchParams.get("studio")');
    expect(hook).toContain("closeStudio");
    expect(hook).toContain("studioEligible");
    expect(hook).toContain("fetchAcquisitionPublishEligibility");
    expect(hook).toContain("fetchMerchantPublishEligibility");
  });

  it("workbench uses market exposure card (not legacy showcase section)", () => {
    const page = read("app/provider/page.tsx");
    expect(page).toContain("MerchantWorkbenchMarketExposureCard");
    expect(page).toContain("ProviderWorkbenchBillingPeriodCard");
    expect(page).not.toContain("ProviderWorkbenchShowcaseSection");
    expect(page).toContain('footerTarget={fromSettings ? "settings" : "none"}');

    const inbox = read("components/provider/ProviderWorkbenchInboxCard.tsx");
    expect(inbox).not.toContain("provider_workbench_open_showcase");
    expect(inbox).not.toContain("MERCHANT_PUBLIC_HREF");
    expect(inbox).not.toContain("ProviderWorkbenchOnboardingLink");
    expect(inbox).not.toContain("ProviderWorkbenchTrustAdmissionLink");
    expect(inbox).not.toContain("provider-workbench-inbox-market-exposure-anchor");
    const exposure = read("components/provider/MerchantWorkbenchMarketExposureCard.tsx");
    expect(exposure).not.toContain("provider_workbench_browse_showcase");
    expect(exposure).toContain("provider-workbench-market-exposure-collapsed");
    expect(exposure).toContain("resolveMerchantMarketExposureReadyActions");
    expect(exposure).toContain("MerchantWorkbenchShowcaseInventory");
    expect(read("app/provider/page.tsx")).toContain("useProviderWorkbenchListings");
    expect(inbox).toContain("merchantOrdersInProgressHref");
  });

  it("merchant settings hides footer when opened from workbench", () => {
    const settings = read("app/me/identities/merchant/settings/MeMerchantProfileSettingsPageInner.tsx");
    expect(settings).toContain('searchParams.get("from") === "provider"');
    expect(settings).toContain("showMinimalFooter={!fromProviderWorkbench}");
  });
});
