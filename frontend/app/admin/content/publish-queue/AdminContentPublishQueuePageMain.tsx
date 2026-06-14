"use client";



import Link from "next/link";

import { useId } from "react";



import { useTranslation } from "@/components/LocaleProvider";

import { AdminContentPageShell, AdminContentStatusBadge } from "@/components/admin/content/AdminContentPageShell";

import {

  AdminContentDataTable,

  AdminContentTableBody,

  AdminContentTableHead,

  AdminContentTableTh,

} from "@/components/admin/content/AdminContentL5Surfaces";

import { ADMIN_TABLE_TD_CELL_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";



import { useAdminContentPublishQueuePage } from "./useAdminContentPublishQueuePage";



export function AdminContentPublishQueuePageMain() {

  const { t } = useTranslation();

  const titleId = useId();

  const { items, loading, error } = useAdminContentPublishQueuePage();



  return (

    <AdminContentPageShell

      titleId={titleId}

      titleKey="admin_content_publish_queue_title"

      subtitleKey="admin_content_publish_queue_subtitle"

      loading={loading}

      error={error}

    >

      <p className="mb-4 text-body-s text-ink-600">{t("admin_content_publish_queue_readonly_note")}</p>

      <Link

        href="/admin/content/countries"

        className={`inline-flex min-h-[44px] items-center rounded-lg border border-ink-900 px-4 py-2 text-body-s font-medium text-ink-900 ${adminPageNavLinkClass()}`}

        data-tt-admin-content-publish-queue-cta="1"

      >

        {t("admin_content_publish_queue_go_countries")}

      </Link>

      <div data-tt-admin-content-publish-queue="1">

        <AdminContentDataTable dataAttr="content-publish-queue">

          <AdminContentTableHead>

            <tr>

              <AdminContentTableTh>{t("admin_content_col_entity")}</AdminContentTableTh>

              <AdminContentTableTh>{t("admin_content_col_label")}</AdminContentTableTh>

              <AdminContentTableTh>{t("admin_content_col_status")}</AdminContentTableTh>

              <AdminContentTableTh>{t("admin_content_col_version")}</AdminContentTableTh>

            </tr>

          </AdminContentTableHead>

          <AdminContentTableBody>

            {items.length === 0 ? (

              <tr>

                <td colSpan={4} className={`${ADMIN_TABLE_TD_CELL_CLASS} text-ink-500`}>

                  {t("admin_content_publish_queue_empty")}

                </td>

              </tr>

            ) : (

              items.map((row) => (

                <tr key={`${row.entity_type}-${row.entity_id}`}>

                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.entity_type}</td>

                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.label}</td>

                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>

                    <AdminContentStatusBadge status={row.publish_status} />

                  </td>

                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.version}</td>

                </tr>

              ))

            )}

          </AdminContentTableBody>

        </AdminContentDataTable>

      </div>

    </AdminContentPageShell>

  );

}


