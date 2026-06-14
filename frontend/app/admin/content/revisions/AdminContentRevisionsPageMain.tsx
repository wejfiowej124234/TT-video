"use client";



import { useId } from "react";



import { useTranslation } from "@/components/LocaleProvider";

import { AdminContentPageShell } from "@/components/admin/content/AdminContentPageShell";

import {

  AdminContentDataTable,

  AdminContentTableBody,

  AdminContentTableHead,

  AdminContentTableTh,

} from "@/components/admin/content/AdminContentL5Surfaces";

import { ADMIN_TABLE_TD_CELL_CLASS } from "@/lib/adminUi";



import { useAdminContentRevisionsPage } from "./useAdminContentRevisionsPage";



export function AdminContentRevisionsPageMain() {

  const { t } = useTranslation();

  const titleId = useId();

  const { items, loading, error } = useAdminContentRevisionsPage();



  return (

    <AdminContentPageShell

      titleId={titleId}

      titleKey="admin_content_revisions_title"

      subtitleKey="admin_content_revisions_subtitle"

      loading={loading}

      error={error}

    >

      <div data-tt-admin-content-revisions-list="1">

        <AdminContentDataTable dataAttr="content-revisions-list">

          <AdminContentTableHead>

            <tr>

              <AdminContentTableTh>{t("admin_content_col_entity")}</AdminContentTableTh>

              <AdminContentTableTh>{t("admin_content_col_action")}</AdminContentTableTh>

              <AdminContentTableTh>{t("admin_content_col_version")}</AdminContentTableTh>

              <AdminContentTableTh>{t("admin_content_col_created")}</AdminContentTableTh>

            </tr>

          </AdminContentTableHead>

          <AdminContentTableBody>

            {items.map((row) => (

              <tr key={row.id}>

                <td className={ADMIN_TABLE_TD_CELL_CLASS}>

                  {row.entity_type} · {row.entity_id.slice(0, 8)}

                </td>

                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.action}</td>

                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.version}</td>

                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.created_at ?? "—"}</td>

              </tr>

            ))}

          </AdminContentTableBody>

        </AdminContentDataTable>

      </div>

    </AdminContentPageShell>

  );

}


