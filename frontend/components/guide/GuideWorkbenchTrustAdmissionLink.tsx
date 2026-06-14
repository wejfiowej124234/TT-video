"use client";

import Link from "next/link";
import { FOCUS_RING } from "@/components/me/constants";
import { ME_SETTINGS_TRUST_PATH } from "@/lib/me/meTrustKycL5";
import { authL5InlineLinkFocusClasses, touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";

export type GuideWorkbenchTrustAdmissionLinkProps = {
  t: (key: string) => string;
  /** navLink 次按钮 · primary 收件箱阻塞主 CTA · footer 底栏 */
  variant?: "navLink" | "primary" | "footer";
  className?: string;
  /** 收件箱空态主 CTA 探针（契约 / E2E） */
  inboxPrimaryProbe?: boolean;
};

const FOOTER_LINK =
  `${touchTargetLink44Classes} inline-flex items-center text-small font-medium text-ref-sun/75 underline decoration-ref-sun/35 underline-offset-4 hover:text-[#fde9a8] hover:decoration-ref-sun/55 transition-colors motion-reduce:transition-none ${authL5InlineLinkFocusClasses}`;

/** `/me/settings/trust` 准入 SSOT · 工作台统一入口样式 */
export function GuideWorkbenchTrustAdmissionLink({
  t,
  variant = "navLink",
  className = "",
  inboxPrimaryProbe = false,
}: GuideWorkbenchTrustAdmissionLinkProps) {
  const classes =
    variant === "footer"
      ? `${FOOTER_LINK} ${className}`.trim()
      : variant === "primary"
        ? `${TT_WORKSPACE_L5.primaryBtn} min-h-[44px] justify-center ${FOCUS_RING} ${className}`.trim()
        : `${TT_WORKSPACE_L5.navLink} min-h-[44px] justify-center ${FOCUS_RING} ${className}`.trim();

  return (
    <Link
      href={ME_SETTINGS_TRUST_PATH}
      className={classes}
      data-tt-guide-workbench-trust-admission-link="1"
      {...(inboxPrimaryProbe ? { "data-tt-guide-workbench-inbox-trust-link": "1" } : {})}
    >
      {t("guide_workbench_trust_admission_cta")}
    </Link>
  );
}
