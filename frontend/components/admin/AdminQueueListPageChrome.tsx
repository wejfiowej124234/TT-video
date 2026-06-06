"use client";



import type { ReactNode } from "react";

import { usePathname } from "next/navigation";



import { useTranslation } from "@/components/LocaleProvider";

import { AdminPageAccessBadge } from "@/components/admin/AdminPageAccessBadge";

import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";

import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";

import { adminWritePermissionForPathname } from "@/lib/admin/adminListPageWritePermission";

import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";

import { AdminSubpageBreadcrumb } from "@/components/admin/AdminSubpageBreadcrumb";

import {

  PROVIDER_QUEUE_RELATED_FOLD_LINKS,

  STEWARD_QUEUE_RELATED_FOLD_LINKS,

} from "@/lib/admin/adminOpsListRelatedFoldLinks";

import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";

import {

  ADMIN_ATTENTION_CALLOUT_CLASS,

  ADMIN_LIST_PAGE_BODY_CANVAS_CLASS,

  ADMIN_PAGE_CHROME_SUBTITLE_CLASS,

  ADMIN_PAGE_CHROME_TITLE_CLASS,

  TT_ADMIN_PAGE_INNER_LIST,

} from "@/lib/adminUi";



export type AdminQueueListKind = "provider" | "steward";



export function AdminQueueListPageChrome(props: {

  queue: AdminQueueListKind;

  titleId: string;

  titleKey: string;

  subtitleKey: string;

  children: ReactNode;

}) {

  const { t } = useTranslation();

  const pathname = usePathname() ?? "";

  const { queue, titleId, titleKey, subtitleKey, children } = props;



  const writePermission = adminWritePermissionForPathname(pathname);



  return (

    <main

      className={TT_ADMIN_PAGE_INNER_LIST}

      aria-labelledby={titleId}

      data-tt-admin-app-page="1"

      data-tt-admin-queue-list={queue}

    >

      <AdminSubpageBreadcrumb />

      <AdminWarmL5Surface

        as="header"

        innerClassName="flex flex-wrap items-start justify-between gap-3"

        data-tt-admin-queue-list-header="1"

      >

        <div>

          <div className="flex flex-wrap items-center gap-2">

            <h1 id={titleId} className={ADMIN_PAGE_CHROME_TITLE_CLASS}>

              {t(titleKey)}

            </h1>

            <AdminPageAccessBadge writePermissionId={writePermission} />

          </div>

          <p className={ADMIN_PAGE_CHROME_SUBTITLE_CLASS}>{t(subtitleKey)}</p>

        </div>

      </AdminWarmL5Surface>

      <AdminOpsDetailRelatedFold

        relatedLinks={

          queue === "provider" ? PROVIDER_QUEUE_RELATED_FOLD_LINKS : STEWARD_QUEUE_RELATED_FOLD_LINKS

        }

        ariaLabelKey="admin_ops_list_related_aria"

        foldSummaryKey="admin_ops_list_related_fold"

        dataTtFold={queue === "provider" ? "provider-queue-list" : "steward-queue-list"}

      />

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

