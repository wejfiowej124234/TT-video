"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { AdminInboxQueueBackLinks } from "@/components/admin/AdminInboxQueueBackLinks";
import { useTranslation } from "@/components/LocaleProvider";
import { adminPageNavLinkClass } from "@/lib/adminUi";

/** 入驻子域顶栏：任务收件箱 → 入驻枢纽 → 页内操作。 */
export function AdminOnboardingHubBackLinks({ children }: { children?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <>
      <AdminInboxQueueBackLinks />
      <Link
        href="/admin/onboarding"
        className={adminPageNavLinkClass()}
        data-tt-admin-back-onboarding-hub="1"
      >
        {t("admin_onboarding_hub_title")}
      </Link>
      {children}
    </>
  );
}
