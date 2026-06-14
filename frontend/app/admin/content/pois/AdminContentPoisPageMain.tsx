"use client";



import { useId } from "react";

import { useSearchParams } from "next/navigation";



import { useTranslation } from "@/components/LocaleProvider";

import { AdminContentPageShell, AdminContentStatusBadge } from "@/components/admin/content/AdminContentPageShell";

import {

  AdminContentDataTable,

  AdminContentTableBody,

  AdminContentTableHead,

  AdminContentTableTh,

} from "@/components/admin/content/AdminContentL5Surfaces";

import { ADMIN_TABLE_TD_CELL_CLASS } from "@/lib/adminUi";



import { useAdminContentPoisPage } from "./useAdminContentPoisPage";



export function AdminContentPoisPageMain() {

  const { t } = useTranslation();

  const titleId = useId();

  const params = useSearchParams();

  const poiType = params.get("type") ?? undefined;

  const { items, loading, error } = useAdminContentPoisPage(poiType ?? undefined);



  return (

    <AdminContentPageShell

      titleId={titleId}

      titleKey="admin_content_pois_title"

      subtitleKey="admin_content_pois_subtitle"

      loading={loading}

      error={error}

    >

      <div data-tt-admin-content-pois-list="1">

        <AdminContentDataTable dataAttr="content-pois-list">

          <AdminContentTableHead>

            <tr>

              <AdminContentTableTh>{t("admin_content_col_type")}</AdminContentTableTh>

              <AdminContentTableTh>{t("admin_content_col_city")}</AdminContentTableTh>

              <AdminContentTableTh>{t("admin_content_field_name_zh")}</AdminContentTableTh>

              <AdminContentTableTh>{t("admin_content_col_status")}</AdminContentTableTh>

              <AdminContentTableTh>{t("admin_content_col_version")}</AdminContentTableTh>

            </tr>

          </AdminContentTableHead>

          <AdminContentTableBody>

            {items.map((row) => (

              <tr key={row.id}>

                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.poi_type}</td>

                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.city_name_zh}</td>

                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.name_zh}</td>

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


