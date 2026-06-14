"use client";



import { useId } from "react";



import { useTranslation } from "@/components/LocaleProvider";

import { AdminContentPageShell, AdminContentStatusBadge } from "@/components/admin/content/AdminContentPageShell";

import {

  AdminContentDataTable,

  AdminContentTableBody,

  AdminContentTableHead,

  AdminContentTableTh,

} from "@/components/admin/content/AdminContentL5Surfaces";

import { ADMIN_TABLE_TD_CELL_CLASS } from "@/lib/adminUi";



import { useAdminContentRoutesPage } from "./useAdminContentRoutesPage";



export function AdminContentRoutesPageMain() {

  const { t } = useTranslation();

  const titleId = useId();

  const { items, loading, error } = useAdminContentRoutesPage();



  return (

    <AdminContentPageShell

      titleId={titleId}

      titleKey="admin_content_routes_title"

      subtitleKey="admin_content_routes_subtitle"

      loading={loading}

      error={error}

    >

      <div data-tt-admin-content-routes-list="1">

        <AdminContentDataTable dataAttr="content-routes-list">

          <AdminContentTableHead>

            <tr>

              <AdminContentTableTh>{t("admin_content_col_from")}</AdminContentTableTh>

              <AdminContentTableTh>{t("admin_content_col_to")}</AdminContentTableTh>

              <AdminContentTableTh>{t("admin_content_col_mode")}</AdminContentTableTh>

              <AdminContentTableTh>{t("admin_content_col_status")}</AdminContentTableTh>

            </tr>

          </AdminContentTableHead>

          <AdminContentTableBody>

            {items.map((row) => (

              <tr key={row.id}>

                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.from_city_name_zh}</td>

                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.to_city_name_zh}</td>

                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.mode}</td>

                <td className={ADMIN_TABLE_TD_CELL_CLASS}>

                  <AdminContentStatusBadge status={row.publish_status} />

                </td>

              </tr>

            ))}

          </AdminContentTableBody>

        </AdminContentDataTable>

      </div>

    </AdminContentPageShell>

  );

}


