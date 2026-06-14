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



import { useAdminContentTransportRulesPage } from "./useAdminContentTransportRulesPage";



export function AdminContentTransportRulesPageMain() {

  const { t } = useTranslation();

  const titleId = useId();

  const { items, loading, error } = useAdminContentTransportRulesPage();



  return (

    <AdminContentPageShell

      titleId={titleId}

      titleKey="admin_content_transport_rules_title"

      subtitleKey="admin_content_transport_rules_subtitle"

      loading={loading}

      error={error}

    >

      <div data-tt-admin-content-transport-rules-list="1">

        <AdminContentDataTable dataAttr="content-transport-rules-list">

          <AdminContentTableHead>

            <tr>

              <AdminContentTableTh>{t("admin_content_col_country")}</AdminContentTableTh>

              <AdminContentTableTh>{t("admin_content_col_modes")}</AdminContentTableTh>

              <AdminContentTableTh>{t("admin_content_col_status")}</AdminContentTableTh>

              <AdminContentTableTh>{t("admin_content_col_version")}</AdminContentTableTh>

            </tr>

          </AdminContentTableHead>

          <AdminContentTableBody>

            {items.map((row) => (

              <tr key={row.id}>

                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.country_name_zh}</td>

                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.default_modes.join(", ")}</td>

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


