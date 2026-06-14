import { describe, expect, it } from "vitest";

import {

  meAcquisitionWorkspaceUnlocked,

  meSettingsShowAcquisitionHub,

  meSettingsShowGuideHub,

  meSettingsShowMerchantHub,

  meSettingsShowStewardHub,

  meMerchantWorkspaceUnlocked,

  meGuideWorkspaceUnlocked,

  meStewardWorkspaceUnlocked,

} from "@/lib/me/meIdentitySlotVisibility";



describe("meIdentitySlotVisibility (multi-slot hub)", () => {

  it("shows merchant hub when merchant slot active but role is guide", () => {

    expect(

      meSettingsShowMerchantHub({ userRole: "guide", merchantSlotState: "active" }),

    ).toBe(true);

  });



  it("unlocks merchant workspace from active slot without provider role", () => {

    expect(

      meMerchantWorkspaceUnlocked({ userRole: "guide", merchantSlotState: "active" }),

    ).toBe(true);

    expect(

      meMerchantWorkspaceUnlocked({ userRole: "guide", merchantSlotState: "pending" }),

    ).toBe(false);

  });



  it("does not show merchant hub when slot pending only", () => {

    expect(

      meSettingsShowMerchantHub({ userRole: "tourist", merchantSlotState: "pending" }),

    ).toBe(false);

  });



  it("unlocks guide workspace from active slot without guide role", () => {

    expect(

      meGuideWorkspaceUnlocked({ userRole: "tourist", guideSlotState: "active" }),

    ).toBe(true);

  });



  it("does not show steward hub when steward slot pending", () => {

    expect(

      meSettingsShowStewardHub({ userRole: "guide", stewardSlotState: "pending" }),

    ).toBe(false);

  });



  it("unlocks steward workspace from active slot without region_steward role", () => {

    expect(

      meStewardWorkspaceUnlocked({ userRole: "guide", stewardSlotState: "active" }),

    ).toBe(true);

    expect(

      meStewardWorkspaceUnlocked({ userRole: "guide", stewardSlotState: "pending" }),

    ).toBe(false);

  });



  it("shows guide hub from role or active slot only", () => {

    expect(meSettingsShowGuideHub({ userRole: "tourist", guideSlotState: "active" })).toBe(true);

    expect(meSettingsShowGuideHub({ userRole: "guide", guideSlotState: null })).toBe(true);

    expect(meSettingsShowGuideHub({ userRole: "tourist", guideSlotState: "pending" })).toBe(false);

  });



  it("shows acquisition hub when acquisition slot active or pending", () => {

    expect(meAcquisitionWorkspaceUnlocked({ acquisitionSlotState: "active" })).toBe(true);

    expect(meAcquisitionWorkspaceUnlocked({ acquisitionSlotState: "pending" })).toBe(true);

    expect(meAcquisitionWorkspaceUnlocked({ acquisitionSlotState: "inactive" })).toBe(false);

    expect(meSettingsShowAcquisitionHub({ acquisitionSlotState: null })).toBe(false);

  });

});

