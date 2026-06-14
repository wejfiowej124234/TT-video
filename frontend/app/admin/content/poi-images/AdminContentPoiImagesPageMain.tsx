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

import { ADMIN_TABLE_TD_CELL_CLASS } from "@/lib/adminUi";



import { useAdminContentPoiImagesPage } from "./useAdminContentPoiImagesPage";



export function AdminContentPoiImagesPageMain() {

  const { t } = useTranslation();

  const titleId = useId();

  const { items, loading, error } = useAdminContentPoiImagesPage();



  return (

    <AdminContentPageShell

      titleId={titleId}

      titleKey="admin_content_poi_images_title"

      subtitleKey="admin_content_poi_images_subtitle"

      loading={loading}

      error={error}

    >

      <div data-tt-admin-content-poi-images-list="1">

        <AdminContentDataTable dataAttr="content-poi-images-list">

          <AdminContentTableHead>

            <tr>

              <AdminContentTableTh>{t("admin_content_col_batch")}</AdminContentTableTh>

              <AdminContentTableTh>{t("admin_content_col_city")}</AdminContentTableTh>

              <AdminContentTableTh>{t("admin_content_col_type")}</AdminContentTableTh>

              <AdminContentTableTh>{t("admin_content_col_status")}</AdminContentTableTh>

              <AdminContentTableTh>{t("admin_content_poi_images_col_coverage")}</AdminContentTableTh>

              <AdminContentTableTh>{t("admin_content_col_version")}</AdminContentTableTh>

            </tr>

          </AdminContentTableHead>

          <AdminContentTableBody>

            {items.length === 0 ? (

              <tr>

                <td colSpan={6} className={`${ADMIN_TABLE_TD_CELL_CLASS} text-ink-500`}>

                  {t("admin_content_poi_images_empty")}

                </td>

              </tr>

            ) : (

              items.map((row) => (

                <tr key={row.id}>

                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>

                    <Link

                      href={`/admin/content/poi-images/batches/${row.id}`}

                      className="text-brand-600 hover:underline"

                    >

                      {row.batch_name}

                    </Link>

                  </td>

                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.city_name_zh ?? "—"}</td>

                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.poi_kind}</td>

                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>

                    <AdminContentStatusBadge status={row.status} />

                  </td>

                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>

                    {row.approved_count}/{row.poi_count}

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


