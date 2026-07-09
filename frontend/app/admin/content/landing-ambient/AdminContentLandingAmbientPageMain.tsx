"use client";

import { useId, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminContentPageShell, AdminContentStatusBadge } from "@/components/admin/content/AdminContentPageShell";
import {
  AdminContentDataTable,
  AdminContentTableBody,
  AdminContentTableHead,
  AdminContentTableTh,
} from "@/components/admin/content/AdminContentL5Surfaces";
import {
  ADMIN_FILTER_INPUT_SM_CLASS,
  ADMIN_TABLE_TD_CELL_CLASS,
  adminTableRowPrimaryActionClass,
} from "@/lib/adminUi";

import {
  landingAmbientUrlFromRow,
  useAdminContentLandingAmbientPage,
} from "./useAdminContentLandingAmbientPage";

export function AdminContentLandingAmbientPageMain() {
  const { t } = useTranslation();
  const titleId = useId();
  const { items, loading, error, busy, saveLandingUrl } = useAdminContentLandingAmbientPage();
  const [editUrls, setEditUrls] = useState<Record<string, string>>({});

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
              <AdminContentTableTh>{t("admin_content_col_url")}</AdminContentTableTh>
              <AdminContentTableTh>{t("admin_content_col_status")}</AdminContentTableTh>
              <AdminContentTableTh>{t("admin_content_col_version")}</AdminContentTableTh>
              <AdminContentTableTh>{t("admin_content_col_actions")}</AdminContentTableTh>
            </tr>
          </AdminContentTableHead>
          <AdminContentTableBody>
            {items.map((row) => {
              const url = editUrls[row.id] ?? landingAmbientUrlFromRow(row);
              const previewUrl = url.trim();
              return (
                <tr key={row.id}>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.name_zh}</td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.iso3166}</td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                    <input
                      className={`w-full min-w-[12rem] ${ADMIN_FILTER_INPUT_SM_CLASS}`}
                      value={url}
                      onChange={(e) =>
                        setEditUrls((prev) => ({ ...prev, [row.id]: e.target.value }))
                      }
                      data-tt-admin-content-landing-ambient-url={row.id}
                    />
                  </td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                    <AdminContentStatusBadge status={row.landing?.publish_status ?? row.publish_status} />
                  </td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.landing?.version ?? row.version}</td>
                  <td className={`${ADMIN_TABLE_TD_CELL_CLASS} space-x-2`}>
                    <button
                      type="button"
                      disabled={busy}
                      className={adminTableRowPrimaryActionClass()}
                      data-tt-admin-content-landing-ambient-save={row.id}
                      onClick={() => void saveLandingUrl(row, url)}
                    >
                      {t("admin_content_action_save")}
                    </button>
                    {previewUrl ? (
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-body-s"
                        data-tt-admin-content-landing-ambient-preview={row.id}
                      >
                        {t("admin_content_landing_ambient_preview")}
                      </a>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </AdminContentTableBody>
        </AdminContentDataTable>
      </div>
    </AdminContentPageShell>
  );
}
