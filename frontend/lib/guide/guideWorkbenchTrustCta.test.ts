import { describe, expect, it } from "vitest";

import {

  GUIDE_WORKBENCH_KYC_STATUS_HREF,

  resolveGuideWorkbenchTrustCta,

} from "./guideWorkbenchTrustCta";

import { ME_IDENTITIES_HUB_PATH } from "@/lib/me/meIdentitiesL5";

import { ME_TRUST_KYC_STATUS_HREF } from "@/lib/me/meTrustKycL5";

import type { MeTrustSummary } from "@/lib/meTrust";



const base: MeTrustSummary = {

  kyc_status: "verified",

  risk_level: "low",

  recommended_actions: [],

};



describe("resolveGuideWorkbenchTrustCta", () => {

  it("routes KYC-not-started to settings trust (not transparency hub)", () => {

    const cta = resolveGuideWorkbenchTrustCta({ ...base, kyc_status: "none" });

    expect(cta.href).toBe(ME_TRUST_KYC_STATUS_HREF);

    expect(cta.href).toBe(GUIDE_WORKBENCH_KYC_STATUS_HREF);

    expect(cta.labelKey).toBe("guide_workbench_trust_cta_kyc_status");

  });



  it("routes rejected KYC with review outcome label", () => {

    const cta = resolveGuideWorkbenchTrustCta({ ...base, kyc_status: "rejected" });

    expect(cta.href).toBe(ME_TRUST_KYC_STATUS_HREF);

    expect(cta.labelKey).toBe("guide_workbench_trust_cta_kyc_rejected");

  });



  it("routes verified KYC to identity hub", () => {

    const cta = resolveGuideWorkbenchTrustCta(base);

    expect(cta.href).toBe(ME_IDENTITIES_HUB_PATH);

    expect(cta.labelKey).toBe("guide_workbench_trust_summary_cta");

  });

});


