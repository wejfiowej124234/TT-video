"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { AdminInboxQueueBackLinks } from "@/components/admin/AdminInboxQueueBackLinks";
import { useTranslation } from "@/components/LocaleProvider";
import { ADMIN_INLINE_LINK_CLASS, ADMIN_LINK_FOCUS_CLASS } from "@/lib/adminUi";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

/** 入驻队列列表顶栏：任务收件箱 → 入驻枢纽 → 页内交叉链。 */
export function AdminOnboardingQueueBackLinks(props: {
  secondaryHref?: string;
  secondaryLabelKey?: string;
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  const { secondaryHref, secondaryLabelKey, children } = props;

  return (
    <>
      <AdminInboxQueueBackLinks showWorkspace={false} />
      <Link
        href="/admin/onboarding"
        className={`${touchTargetLink44Classes} ${ADMIN_INLINE_LINK_CLASS} ${ADMIN_LINK_FOCUS_CLASS}`}
        data-tt-admin-back-onboarding-hub="1"
      >
        {t("admin_onboarding_hub_title")}
      </Link>
      {secondaryHref && secondaryLabelKey ? (
        <Link
          href={secondaryHref}
          className={`${touchTargetLink44Classes} ${ADMIN_INLINE_LINK_CLASS} ${ADMIN_LINK_FOCUS_CLASS}`}
        >
          {t(secondaryLabelKey)}
        </Link>
      ) : null}
      {children}
    </>
  );
}
