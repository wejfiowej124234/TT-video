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



import { useAdminContentLandingAmbientPage } from "./useAdminContentLandingAmbientPage";



export function AdminContentLandingAmbientPageMain() {

  const { t } = useTranslation();

  const titleId = useId();

  const { items, loading, error } = useAdminContentLandingAmbientPage();



  return (

    <AdminContentPageShell

      titleId={titleId}

      titleKey="admin_content_landing_ambient_title"

      subtitleKey="admin_content_landing_ambient_subtitle"

      loading={loading}

      error={error}

    >

      <div data-tt-admin-content-landing-ambient-list="1">

        <AdminContentDataTable dataAttr="content-landing-ambient-list">

          <AdminContentTableHead>

            <tr>

              <AdminContentTableTh>{t("admin_content_col_country")}</AdminContentTableTh>

              <AdminContentTableTh>{t("admin_content_col_iso")}</AdminContentTableTh>

              <AdminContentTableTh>{t("admin_content_col_ambient")}</AdminContentTableTh>

              <AdminContentTableTh>{t("admin_content_col_status")}</AdminContentTableTh>

              <AdminContentTableTh>{t("admin_content_col_version")}</AdminContentTableTh>

            </tr>

          </AdminContentTableHead>

          <AdminContentTableBody>

            {items.map((row) => (

              <tr key={row.id}>

                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.name_zh}</td>

                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.iso3166}</td>

                <td className={ADMIN_TABLE_TD_CELL_CLASS}>

                  {row.landing?.landing_ambient?.url ? String(row.landing.landing_ambient.url) : "—"}

                </td>

                <td className={ADMIN_TABLE_TD_CELL_CLASS}>

                  <AdminContentStatusBadge status={row.publish_status} />

                </td>

                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.landing?.version ?? row.version}</td>

              </tr>

            ))}

          </AdminContentTableBody>

        </AdminContentDataTable>

      </div>

    </AdminContentPageShell>

  );

}


