"use client";

import Link from "next/link";
import { meOnboardingHref } from "@/app/me/onboarding/meOnboardingLoginReturn";
import { FOCUS_RING } from "@/components/me/constants";
import { ME_SETTINGS_TRUST_PATH } from "@/lib/me/meTrustKycL5";
import { authL5InlineLinkFocusClasses, touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";

export type ProviderWorkbenchAdmissionLinkProps = {
  t: (key: string) => string;
  variant?: "navLink" | "primary" | "footer";
  className?: string;
  inboxPrimaryProbe?: boolean;
};

const FOOTER_LINK =
  `${touchTargetLink44Classes} inline-flex items-center text-small font-medium text-ref-sun/75 underline decoration-ref-sun/35 underline-offset-4 hover:text-[#fde9a8] hover:decoration-ref-sun/55 transition-colors motion-reduce:transition-none ${authL5InlineLinkFocusClasses}`;

function linkClasses(
  variant: ProviderWorkbenchAdmissionLinkProps["variant"],
  className: string,
): string {
  if (variant === "footer") return `${FOOTER_LINK} ${className}`.trim();
  if (variant === "primary") {
    return `${TT_WORKSPACE_L5.primaryBtn} min-h-[44px] justify-center ${FOCUS_RING} ${className}`.trim();
  }
  return `${TT_WORKSPACE_L5.navLink} min-h-[44px] justify-center ${FOCUS_RING} ${className}`.trim();
}

/** `/me/settings/trust` · 商家准入 SSOT */
export function ProviderWorkbenchTrustAdmissionLink({
  t,
  variant = "navLink",
  className = "",
  inboxPrimaryProbe = false,
}: ProviderWorkbenchAdmissionLinkProps) {
  return (
    <Link
      href={ME_SETTINGS_TRUST_PATH}
      className={linkClasses(variant, className)}
      data-tt-provider-workbench-trust-admission-link="1"
      {...(inboxPrimaryProbe ? { "data-tt-provider-workbench-inbox-trust-link": "1" } : {})}
    >
      {t("provider_workbench_trust_admission_cta")}
    </Link>
  );
}

/** B 轨准入费 · `/me/onboarding?role=provider` */
export function ProviderWorkbenchOnboardingLink({
  t,
  variant = "navLink",
  className = "",
  inboxPrimaryProbe = false,
}: ProviderWorkbenchAdmissionLinkProps) {
  return (
    <Link
      href={meOnboardingHref("provider", { from: "provider_pending" })}
      className={linkClasses(variant, className)}
      data-tt-provider-workbench-onboarding-link="1"
      {...(inboxPrimaryProbe ? { "data-tt-provider-workbench-inbox-onboarding-link": "1" } : {})}
    >
      {t("provider_workbench_onboarding_cta")}
    </Link>
  );
}
