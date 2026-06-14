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



import { useAdminContentHotelTiersPage } from "./useAdminContentHotelTiersPage";



export function AdminContentHotelTiersPageMain() {

  const { t } = useTranslation();

  const titleId = useId();

  const { items, loading, error } = useAdminContentHotelTiersPage();



  return (

    <AdminContentPageShell

      titleId={titleId}

      titleKey="admin_content_hotel_tiers_title"

      subtitleKey="admin_content_hotel_tiers_subtitle"

      loading={loading}

      error={error}

    >

      <div data-tt-admin-content-hotel-tiers-list="1">

        <AdminContentDataTable dataAttr="content-hotel-tiers-list">

          <AdminContentTableHead>

            <tr>

              <AdminContentTableTh>{t("admin_content_col_tier")}</AdminContentTableTh>

              <AdminContentTableTh>{t("admin_content_col_multiplier")}</AdminContentTableTh>

              <AdminContentTableTh>{t("admin_content_col_status")}</AdminContentTableTh>

              <AdminContentTableTh>{t("admin_content_col_version")}</AdminContentTableTh>

            </tr>

          </AdminContentTableHead>

          <AdminContentTableBody>

            {items.map((row) => (

              <tr key={row.id}>

                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.tier_code}</td>

                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.multiplier}</td>

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


