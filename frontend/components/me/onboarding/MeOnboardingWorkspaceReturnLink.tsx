"use client";

import Link from "next/link";
import { TT_ME_ONBOARDING_L5 } from "@/lib/me/meOnboardingL5";

/** 从经营工作台跳入准入页时，提供 Console 族回链（不改 onboarding 浅色壳） */
export function MeOnboardingWorkspaceReturnLink({
  t,
  href,
  labelKey,
  className = "mt-4",
}: {
  t: (key: string) => string;
  href: string;
  labelKey: string;
  className?: string;
}) {
  return (
    <p className={className} data-tt-me-onboarding-workspace-return="1">
      <Link href={href} className={TT_ME_ONBOARDING_L5.gateDeferLink}>
        {t(labelKey)}
      </Link>
    </p>
  );
}
