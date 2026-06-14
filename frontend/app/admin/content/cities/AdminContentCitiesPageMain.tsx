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



import { useAdminContentCitiesPage } from "./useAdminContentCitiesPage";



export function AdminContentCitiesPageMain() {

  const { t } = useTranslation();

  const titleId = useId();

  const { items, loading, error } = useAdminContentCitiesPage();



  return (

    <AdminContentPageShell

      titleId={titleId}

      titleKey="admin_content_cities_title"

      subtitleKey="admin_content_cities_subtitle"

      loading={loading}

      error={error}

    >

      <div data-tt-admin-content-cities-list="1">

        <AdminContentDataTable dataAttr="content-cities-list">

          <AdminContentTableHead>

            <tr>

              <AdminContentTableTh>{t("admin_content_col_country")}</AdminContentTableTh>

              <AdminContentTableTh>{t("admin_content_field_name_zh")}</AdminContentTableTh>

              <AdminContentTableTh>{t("admin_content_col_slug")}</AdminContentTableTh>

              <AdminContentTableTh>{t("admin_content_col_status")}</AdminContentTableTh>

              <AdminContentTableTh>{t("admin_content_col_version")}</AdminContentTableTh>

            </tr>

          </AdminContentTableHead>

          <AdminContentTableBody>

            {items.map((row) => (

              <tr key={row.id}>

                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.country_name_zh}</td>

                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.name_zh}</td>

                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.slug}</td>

                <td className={ADMIN_TABLE_TD_CELL_CLASS}>

                  <AdminContentStatusBadge status={row.publish_status} />

                </td>

                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.version}</td>

              </tr>

            ))}

          </AdminContentTableBody>

        </AdminContentDataTable>

      </div>

    </AdminContentPageShell>

  );

}


