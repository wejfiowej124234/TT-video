"use client";

import { useId, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { useAdminL5ConfirmRequest } from "@/components/admin/AdminL5ConfirmProvider";
import { AdminContentPageShell, AdminContentStatusBadge } from "@/components/admin/content/AdminContentPageShell";
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
  ADMIN_INLINE_LINK_CLASS,
  ADMIN_TABLE_TD_CELL_CLASS,
  adminTableRowPrimaryActionClass,
} from "@/lib/adminUi";

import { useAdminContentMediaAssetsPage } from "./useAdminContentMediaAssetsPage";

export function AdminContentMediaAssetsPageMain() {
  const { t } = useTranslation();
  const titleId = useId();
  const requestConfirm = useAdminL5ConfirmRequest();
  const {
    items,
    loading,
    error,
    busy,
    assetKindInput,
    setAssetKindInput,
    sourceType,
    setSourceType,
    url,
    setUrl,
    handleCreate,
    saveUrl,
    submitReview,
    publish,
  } = useAdminContentMediaAssetsPage();
  const [editUrls, setEditUrls] = useState<Record<string, string>>({});

  return (
    <AdminContentPageShell
      titleId={titleId}
      titleKey="admin_content_media_assets_title"
      subtitleKey="admin_content_media_assets_subtitle"
      loading={loading}
      error={error}
    >
      <AdminOpsRiskBanner messageKey="admin_ops_risk_banner_catalog_publish" />
      <AdminContentFormCard onSubmit={handleCreate} dataAttr="content-media-asset-create" className="md:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_content_col_kind")}</span>
          <input
            className={ADMIN_FILTER_INPUT_SM_CLASS}
            value={assetKindInput}
            onChange={(e) => setAssetKindInput(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_content_media_assets_field_source_type")}</span>
          <input
            className={ADMIN_FILTER_INPUT_SM_CLASS}
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1 md:col-span-3">
          <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_content_col_url")}</span>
          <input
            className={ADMIN_FILTER_INPUT_SM_CLASS}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={busy} className={`${adminTableRowPrimaryActionClass()} md:col-span-3`}>
          {t("admin_content_action_create")}
        </button>
      </AdminContentFormCard>

      <div data-tt-admin-content-media-assets-list="1">
        <AdminContentDataTable dataAttr="content-media-assets-list">
          <AdminContentTableHead>
            <tr>
              <AdminContentTableTh>{t("admin_content_col_kind")}</AdminContentTableTh>
              <AdminContentTableTh>{t("admin_content_col_country")}</AdminContentTableTh>
              <AdminContentTableTh>{t("admin_content_col_url")}</AdminContentTableTh>
              <AdminContentTableTh>{t("admin_content_col_status")}</AdminContentTableTh>
              <AdminContentTableTh>{t("admin_content_col_version")}</AdminContentTableTh>
              <AdminContentTableTh>{t("admin_content_col_actions")}</AdminContentTableTh>
            </tr>
          </AdminContentTableHead>
          <AdminContentTableBody>
            {items.map((row) => {
              const editUrl = editUrls[row.id] ?? row.url;
              return (
                <tr key={row.id}>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.asset_kind}</td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.country_name_zh ?? "—"}</td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                    <input
                      className={`w-full max-w-md ${ADMIN_FILTER_INPUT_SM_CLASS}`}
                      value={editUrl}
                      onChange={(e) => setEditUrls((prev) => ({ ...prev, [row.id]: e.target.value }))}
                    />
                    {row.url ? (
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noreferrer"
                        className={`mt-1 block ${ADMIN_INLINE_LINK_CLASS}`}
                      >
                        {t("admin_content_media_assets_preview")}
                      </a>
                    ) : null}
                  </td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                    <AdminContentStatusBadge status={row.publish_status} />
                  </td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.version}</td>
                  <td className={`${ADMIN_TABLE_TD_CELL_CLASS} space-x-2`}>
                    <button type="button" disabled={busy} className="underline" onClick={() => saveUrl(row, editUrl)}>
                      {t("admin_content_action_save")}
                    </button>
                    <button type="button" disabled={busy} className="underline" onClick={() => submitReview(row)}>
                      {t("admin_content_action_submit_review")}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      className="underline"
                      onClick={() => requestConfirm(adminConfirmCatalogPublish(() => publish(row)))}
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
