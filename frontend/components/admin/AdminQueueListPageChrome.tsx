"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminPageAccessBadge } from "@/components/admin/AdminPageAccessBadge";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { adminWritePermissionForPathname } from "@/lib/admin/adminListPageWritePermission";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { AdminSubpageBreadcrumb } from "@/components/admin/AdminSubpageBreadcrumb";
import {
  ADMIN_ATTENTION_CALLOUT_CLASS,
  ADMIN_INLINE_LINK_CLASS,
  ADMIN_LINK_FOCUS_CLASS,
  ADMIN_PAGE_HEADER_CARD_CLASS,
  ADMIN_LIST_PAGE_BODY_CANVAS_CLASS,
  TT_ADMIN_PAGE_INNER_LIST,
} from "@/lib/adminUi";

export type AdminQueueListKind = "provider" | "steward";

export function AdminQueueListPageChrome(props: {
  queue: AdminQueueListKind;
  titleId: string;
  titleKey: string;
  subtitleKey: string;
  secondaryHref?: string;
  secondaryLabelKey?: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const pathname = usePathname() ?? "";
  const {
    queue,
    titleId,
    titleKey,
    subtitleKey,
    secondaryHref = "/admin/users",
    secondaryLabelKey = "admin_user_detail_back_list",
    children,
  } = props;

  const writePermission = adminWritePermissionForPathname(pathname);

  return (
    <main
      className={TT_ADMIN_PAGE_INNER_LIST}
      aria-labelledby={titleId}
      data-tt-admin-app-page="1"
      data-tt-admin-queue-list={queue}
    >
      <AdminSubpageBreadcrumb />
      <header
        className={`${ADMIN_PAGE_HEADER_CARD_CLASS} flex flex-wrap items-start justify-between gap-3`}
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 id={titleId} className="text-h3 font-semibold text-ink-900">
              {t(titleKey)}
            </h1>
            <AdminPageAccessBadge writePermissionId={writePermission} />
          </div>
          <p className="mt-2 max-w-2xl text-body text-ink-600">{t(subtitleKey)}</p>
        </div>
        <Link
          href={secondaryHref}
          className={`${touchTargetLink44Classes} ${ADMIN_INLINE_LINK_CLASS} ${ADMIN_LINK_FOCUS_CLASS}`}
        >
          {t(secondaryLabelKey)}
        </Link>
      </header>
      <AdminPermissionDeniedBanner
        permission={
          queue === "provider" ? ADMIN_PERM.ONBOARDING_PROVIDER_REVIEW : ADMIN_PERM.ONBOARDING_STEWARD_REVIEW
        }
        messageKey={
          queue === "provider" ? "admin_perm_denied_provider_review" : "admin_perm_denied_steward_review"
        }
        className={`mt-4 ${ADMIN_ATTENTION_CALLOUT_CLASS}`}
      />
      <div
        className={ADMIN_LIST_PAGE_BODY_CANVAS_CLASS}
        data-tt-admin-queue-list-body-canvas="1"
      >
        {children}
      </div>
    </main>
  );
}
