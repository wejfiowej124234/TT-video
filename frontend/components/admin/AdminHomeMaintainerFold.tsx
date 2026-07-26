"use client";



import type { ReactNode } from "react";



import Link from "next/link";



import { useTranslation } from "@/components/LocaleProvider";

import AdminAuditCompareLinks from "@/components/admin/AdminAuditCompareLinks";

import { AdminHomeOperatorGuide } from "@/components/admin/AdminHomeOperatorGuide";

import { AdminHomeOpsRoleGuide } from "@/components/admin/AdminHomeOpsRoleGuide";

import { AdminHomePhase2PrepNotice } from "@/components/admin/AdminHomePhase2PrepNotice";

import {

  ADMIN_HOME_MAINTAINER_FOLD_CLASS,

  ADMIN_HOME_SECTION_COMPACT_FRAME_CLASS,

  ADMIN_INLINE_LINK_CLASS,

  ADMIN_TEXT_META_CLASS,

} from "@/lib/adminUi";

import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";



/** ① 维护者折叠：手册、搜索、Staging 预备（非运营主路径）。 */

export function AdminHomeMaintainerFold(props: {

  shellPreview?: ReactNode;

  /** 收件箱聚焦 · 轻框 + 短链（长文手册仍可在展开态访问） */

  focusMode?: boolean;

}) {

  const { t } = useTranslation();

  const { shellPreview, focusMode } = props;



  return (

    <details

      className={focusMode ? ADMIN_HOME_SECTION_COMPACT_FRAME_CLASS : ADMIN_HOME_MAINTAINER_FOLD_CLASS}

      data-tt-admin-home-maintainer-fold="1"

      data-tt-admin-home-maintainer-focus={focusMode ? "1" : undefined}

    >

      <summary

        className={`cursor-pointer text-small font-medium ${ADMIN_TEXT_META_CLASS} marker:content-none [&::-webkit-details-marker]:hidden ${

          focusMode ? "px-3 py-2.5" : ""

        }`}

      >

        {focusMode ? t("admin_home_maintainer_fold_summary_focus") : t("admin_home_maintainer_fold_summary")}

      </summary>

      <div className={`${focusMode ? "border-t border-white/8 px-3 pb-3 pt-2" : "mt-4"} space-y-4`}>

        {shellPreview ? (

          <div data-tt-admin-home-shell-preview-deferred="1">{shellPreview}</div>

        ) : null}

        {focusMode ? (

          <div className="flex flex-wrap gap-2" data-tt-admin-home-maintainer-focus-links="1">

            <Link

              href="/admin/permissions"

              className={`${touchTargetLink44Classes} text-small font-medium ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}

            >

              {t("admin_home_maintainer_focus_permissions")}

            </Link>

            <Link

              href="/admin/observability"

              className={`${touchTargetLink44Classes} text-small font-medium ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}

              data-tt-admin-home-maintainer-observability="1"

            >

              {t("admin_home_maintainer_observability_link")}

            </Link>

            <Link

              href="/admin/operator-guide"

              className={`${touchTargetLink44Classes} text-small font-medium ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}

            >

              {t("admin_home_guide_full_link")}

            </Link>

          </div>

        ) : (

          <>

            <AdminHomeOpsRoleGuide />

            <AdminHomePhase2PrepNotice variant="maintainer" />

            <AdminAuditCompareLinks />

            <AdminHomeOperatorGuide />

            <p className="text-small">
              <Link
                href="/admin/observability"
                className={`${touchTargetLink44Classes} font-medium ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
                data-tt-admin-home-maintainer-observability="1"
              >
                {t("admin_home_maintainer_observability_link")}
              </Link>
            </p>

          </>

        )}

      </div>

    </details>

  );

}


