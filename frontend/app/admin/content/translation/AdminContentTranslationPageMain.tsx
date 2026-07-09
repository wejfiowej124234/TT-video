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
  ADMIN_TABLE_TD_CELL_CLASS,
  adminTableRowPrimaryActionClass,
} from "@/lib/adminUi";

import { useAdminContentTranslationPage } from "./useAdminContentTranslationPage";

export function AdminContentTranslationPageMain() {
  const { t } = useTranslation();
  const titleId = useId();
  const requestConfirm = useAdminL5ConfirmRequest();
  const {
    items,
    loading,
    error,
    busy,
    entityType,
    setEntityType,
    entityId,
    setEntityId,
    locale,
    setLocale,
    fieldKey,
    setFieldKey,
    value,
    setValue,
    handleCreate,
    saveValue,
    submitReview,
    publish,
  } = useAdminContentTranslationPage();
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  return (
    <AdminContentPageShell
      titleId={titleId}
      titleKey="admin_content_translation_title"
      subtitleKey="admin_content_translation_subtitle"
      loading={loading}
      error={error}
    >
      <AdminOpsRiskBanner messageKey="admin_ops_risk_banner_catalog_publish" />
      <AdminContentFormCard onSubmit={handleCreate} dataAttr="content-translation-create" className="md:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_content_col_entity_type")}</span>
          <input
            className={ADMIN_FILTER_INPUT_SM_CLASS}
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_content_col_entity_id")}</span>
          <input
            className={ADMIN_FILTER_INPUT_SM_CLASS}
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_content_col_locale")}</span>
          <input
            className={ADMIN_FILTER_INPUT_SM_CLASS}
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_content_col_field_key")}</span>
          <input
            className={ADMIN_FILTER_INPUT_SM_CLASS}
            value={fieldKey}
            onChange={(e) => setFieldKey(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1 md:col-span-2">
          <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_content_col_value")}</span>
          <input
            className={ADMIN_FILTER_INPUT_SM_CLASS}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={busy} className={`${adminTableRowPrimaryActionClass()} md:col-span-3`}>
          {t("admin_content_action_create")}
        </button>
      </AdminContentFormCard>

      <div data-tt-admin-content-translation-list="1">
        <AdminContentDataTable dataAttr="content-translation-list">
          <AdminContentTableHead>
            <tr>
              <AdminContentTableTh>{t("admin_content_col_entity_type")}</AdminContentTableTh>
              <AdminContentTableTh>{t("admin_content_col_entity_id")}</AdminContentTableTh>
              <AdminContentTableTh>{t("admin_content_col_locale")}</AdminContentTableTh>
              <AdminContentTableTh>{t("admin_content_col_field_key")}</AdminContentTableTh>
              <AdminContentTableTh>{t("admin_content_col_value")}</AdminContentTableTh>
              <AdminContentTableTh>{t("admin_content_col_status")}</AdminContentTableTh>
              <AdminContentTableTh>{t("admin_content_col_version")}</AdminContentTableTh>
              <AdminContentTableTh>{t("admin_content_col_actions")}</AdminContentTableTh>
            </tr>
          </AdminContentTableHead>
          <AdminContentTableBody>
            {items.map((row) => {
              const editValue = editValues[row.id] ?? row.value;
              return (
                <tr key={row.id}>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.entity_type}</td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.entity_id}</td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.locale}</td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.field_key}</td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                    <input
                      className={`w-full max-w-md ${ADMIN_FILTER_INPUT_SM_CLASS}`}
                      value={editValue}
                      onChange={(e) => setEditValues((prev) => ({ ...prev, [row.id]: e.target.value }))}
                    />
                  </td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                    <AdminContentStatusBadge status={row.publish_status} />
                  </td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.version}</td>
                  <td className={`${ADMIN_TABLE_TD_CELL_CLASS} space-x-2`}>
                    <button type="button" disabled={busy} className="underline" onClick={() => saveValue(row, editValue)}>
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
