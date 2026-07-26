"use client";

import { useId, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { useAdminL5ConfirmRequest } from "@/components/admin/AdminL5ConfirmProvider";
import {
  AdminContentPageShell,
  AdminContentStatusBadge,
} from "@/components/admin/content/AdminContentPageShell";
import { AdminContentFormCard } from "@/components/admin/content/AdminContentFormCard";
import {
  AdminContentDataTable,
  AdminContentTableBody,
  AdminContentTableHead,
  AdminContentTableTh,
} from "@/components/admin/content/AdminContentL5Surfaces";
import { AdminOpsRiskBanner } from "@/components/admin/ops/AdminOpsRiskBanner";
import { adminConfirmCatalogPublish } from "@/lib/admin/adminOpsWriteConfirm";
import {
  ADMIN_FILTER_FIELD_LABEL_CLASS,
  ADMIN_FILTER_INPUT_SM_CLASS,
  ADMIN_TABLE_TD_CELL_CLASS,
  adminTableRowPrimaryActionClass,
} from "@/lib/adminUi";

import { useAdminContentCountriesPage } from "./useAdminContentCountriesPage";

export function AdminContentCountriesPageMain() {
  const { t } = useTranslation();
  const titleId = useId();
  const {
    items,
    loading,
    error,
    busy,
    iso3166,
    setIso3166,
    nameZh,
    setNameZh,
    nameEn,
    setNameEn,
    handleCreate,
    submitReview,
    publish,
    saveRow,
    reload,
  } = useAdminContentCountriesPage();
  const requestConfirm = useAdminL5ConfirmRequest();
  const [editNames, setEditNames] = useState<Record<string, { zh: string; en: string }>>({});

  return (
    <AdminContentPageShell
      titleId={titleId}
      titleKey="admin_content_countries_title"
      subtitleKey="admin_content_countries_subtitle"
      loading={loading}
      error={error}
      onRetry={() => void reload()}
    >
      <AdminOpsRiskBanner messageKey="admin_ops_risk_banner_catalog_publish" />
      <AdminContentFormCard
        onSubmit={handleCreate}
        dataAttr="content-country-create"
        className="md:grid-cols-3"
      >
        <label className="flex flex-col gap-1">
          <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_content_field_iso")}</span>
          <input className={ADMIN_FILTER_INPUT_SM_CLASS} value={iso3166} onChange={(e) => setIso3166(e.target.value)} required maxLength={2} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_content_field_name_zh")}</span>
          <input className={ADMIN_FILTER_INPUT_SM_CLASS} value={nameZh} onChange={(e) => setNameZh(e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1">
          <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_content_field_name_en")}</span>
          <input className={ADMIN_FILTER_INPUT_SM_CLASS} value={nameEn} onChange={(e) => setNameEn(e.target.value)} required />
        </label>
        <button type="submit" disabled={busy} className={`${adminTableRowPrimaryActionClass()} md:col-span-3`}>
          {t("admin_content_action_create")}
        </button>
      </AdminContentFormCard>

      <div data-tt-admin-content-countries-list="1">
        <AdminContentDataTable dataAttr="content-countries-list">
          <AdminContentTableHead>
            <tr>
              <AdminContentTableTh>{t("admin_content_col_iso")}</AdminContentTableTh>
              <AdminContentTableTh>{t("admin_content_field_name_zh")}</AdminContentTableTh>
              <AdminContentTableTh>{t("admin_content_col_status")}</AdminContentTableTh>
              <AdminContentTableTh>{t("admin_content_col_version")}</AdminContentTableTh>
              <AdminContentTableTh>{t("admin_content_col_actions")}</AdminContentTableTh>
            </tr>
          </AdminContentTableHead>
          <AdminContentTableBody>
            {items.map((row) => {
              const edit = editNames[row.id] ?? { zh: row.name_zh, en: row.name_en };
              return (
                <tr key={row.id}>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.iso3166}</td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                    <input
                      className={`w-full ${ADMIN_FILTER_INPUT_SM_CLASS}`}
                      value={edit.zh}
                      onChange={(e) =>
                        setEditNames((prev) => ({ ...prev, [row.id]: { ...edit, zh: e.target.value } }))
                      }
                    />
                  </td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                    <AdminContentStatusBadge status={row.publish_status} />
                  </td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.version}</td>
                  <td className={`${ADMIN_TABLE_TD_CELL_CLASS} space-x-2`}>
                    <button type="button" disabled={busy} className="underline" onClick={() => saveRow(row, edit.zh, edit.en)}>
                      {t("admin_content_action_save")}
                    </button>
                    <button type="button" disabled={busy} className="underline" onClick={() => submitReview(row)}>
                      {t("admin_content_action_submit_review")}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      className="underline"
                      onClick={() =>
                        requestConfirm(adminConfirmCatalogPublish(() => publish(row)))
                      }
                    >
                      {t("admin_content_action_publish")}
                    </button>
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
