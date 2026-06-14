import { ME_IDENTITIES_HUB_PATH } from "@/lib/me/meIdentitiesL5";

import { ME_TRUST_KYC_STATUS_HREF } from "@/lib/me/meTrustKycL5";

import type { MeTrustSummary } from "@/lib/meTrust";



export { ME_TRUST_KYC_STATUS_HREF as GUIDE_WORKBENCH_KYC_STATUS_HREF };



/** 工作台 Trust 摘要 CTA：KYC 需关注 → 设置·信任页查看状态；已通过 → Identity Hub。 */

export function resolveGuideWorkbenchTrustCta(trust: MeTrustSummary): {

  href: string;

  labelKey: string;

} {

  const kyc = (trust.kyc_status ?? "").trim().toLowerCase();

  const kycNeedsAttention =

    kyc === "" ||

    kyc === "none" ||

    kyc === "pending" ||

    kyc === "in_review" ||

    kyc === "submitted" ||

    kyc === "rejected" ||

    kyc === "failed" ||

    kyc === "declined";



  if (kycNeedsAttention) {

    const rejected = kyc === "rejected" || kyc === "failed" || kyc === "declined";

    return {

      href: ME_TRUST_KYC_STATUS_HREF,

      labelKey: rejected ? "guide_workbench_trust_cta_kyc_rejected" : "guide_workbench_trust_cta_kyc_status",

    };

  }



  return {

    href: ME_IDENTITIES_HUB_PATH,

    labelKey: "guide_workbench_trust_summary_cta",

  };

}


