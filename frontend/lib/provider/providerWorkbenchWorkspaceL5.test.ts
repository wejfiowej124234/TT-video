import { describe, expect, it } from "vitest";
import {
  resolveMerchantInboxEmptyGuidance,
  resolveMerchantMarketExposureActionPlan,
  resolveMerchantMarketExposureReadyActions,
  resolveMerchantMarketExposureSubtitleKey,
} from "./providerWorkbenchWorkspaceL5";

describe("providerWorkbenchWorkspaceL5", () => {
  it("resolveMerchantInboxEmptyGuidance keeps inbox copy minimal when publish blocked", () => {
    const blocked = resolveMerchantInboxEmptyGuidance({ publishEligibilityOk: false });
    expect(blocked.variant).toBe("publish_blocked");
    expect(blocked.bodyKey).toBeUndefined();

    const ready = resolveMerchantInboxEmptyGuidance({ publishEligibilityOk: true });
    expect(ready.variant).toBe("ready");
    expect(ready.bodyKey).toBe("provider_workbench_inbox_empty_ready_body");
  });

  it("resolveMerchantMarketExposureSubtitleKey switches on publish gate", () => {
    expect(resolveMerchantMarketExposureSubtitleKey({ publishEligibilityOk: false })).toBe(
      "provider_workbench_market_exposure_subtitle_blocked",
    );
    expect(resolveMerchantMarketExposureSubtitleKey({ publishEligibilityOk: true })).toBe(
      "provider_workbench_market_exposure_subtitle",
    );
  });

  it("resolveMerchantMarketExposureActionPlan collapses preview when blocked", () => {
    const blocked = resolveMerchantMarketExposureActionPlan({ publishEligibilityOk: false });
    expect(blocked.showStudio).toBe(false);
    expect(blocked.showPreview).toBe(false);
    expect(blocked.showListingCounts).toBe(false);

    const ready = resolveMerchantMarketExposureActionPlan({ publishEligibilityOk: true });
    expect(ready.showStudio).toBe(true);
    expect(ready.showPreview).toBe(true);
    expect(ready.showListingCounts).toBe(true);
  });

  it("resolveMerchantMarketExposureReadyActions prioritizes studio when showcase empty", () => {
    expect(
      resolveMerchantMarketExposureReadyActions({ publishedCount: 0, draftCount: 0 }).primary,
    ).toBe("studio");
    expect(
      resolveMerchantMarketExposureReadyActions({ publishedCount: 1, draftCount: 0 }).primary,
    ).toBe("settings");
  });
});
