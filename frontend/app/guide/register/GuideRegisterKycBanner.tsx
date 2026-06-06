"use client";

import Link from "next/link";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { guideRegBanner, guideRegFocusRing, guideRegLink } from "./guideRegisterUiClasses";

export default function GuideRegisterKycBanner({
  t,
  kycStatus,
  requireVerified,
  softMode = false,
}: {
  t: (key: string) => string;
  kycStatus: string;
  requireVerified: boolean;
  /** 软提示：文案与按钮行为一致，不暗示硬拦 */
  softMode?: boolean;
}) {
  const s = kycStatus.toLowerCase();
  if (s === "verified") return null;
  const blocked = requireVerified || s === "suspended" || s === "rejected";
  const copyKey = blocked
    ? "guideRegister_kycBlocked"
    : softMode
      ? "guideRegister_kycRecommendSoft"
      : "guideRegister_kycRecommend";
  return (
    <div className={`${softMode ? "" : "mb-4"} ${guideRegBanner}`} role="note">
      <p className="text-meta text-slate-200">{t(copyKey)}</p>
      <p className="mt-2">
        <Link href="/me/security" className={`${touchTargetLink44Classes} ${guideRegLink} ${guideRegFocusRing}`}>
          {t("guideRegister_kycCta")}
        </Link>
      </p>
    </div>
  );
}
