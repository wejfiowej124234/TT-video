"use client";

import { useId, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { useAdminL5ConfirmRequest } from "@/components/admin/AdminL5ConfirmProvider";
import { AdminOpsRiskBanner } from "@/components/admin/ops/AdminOpsRiskBanner";
import {
  OfficialOpsDataTable,
  OfficialOpsTableBody,
  OfficialOpsTableHead,
  OfficialOpsTableTh,
} from "@/components/admin/ops/OfficialOpsDataTable";
import { OpsPlaneFetchStates } from "@/components/admin/ops/OpsPlaneFetchStates";
import { adminConfirmOfficialPublish } from "@/lib/admin/adminOpsWriteConfirm";
import { ADMIN_FILTER_FIELD_LABEL_CLASS, ADMIN_FILTER_INPUT_SM_CLASS, ADMIN_TABLE_TD_CELL_CLASS, adminTableRowPrimaryActionClass } from "@/lib/adminUi";

import {
  useAdminOfficialPublicOperationsPublishTab,
  type PublicOpsEntityType,
} from "./useAdminOfficialPublicOperationsPublishTab";

const ENTITY_TYPES: PublicOpsEntityType[] = ["guides", "orders", "market_listings", "community_posts"];

export function AdminOfficialPublicOperationsPublishPanel() {
  const { t } = useTranslation();
  const titleId = useId();
  const requestConfirm = useAdminL5ConfirmRequest();
  const [entityType, setEntityType] = useState<PublicOpsEntityType>("guides");
  const [statusFilter, setStatusFilter] = useState("");
  const { items, loading, error, busy, reload, publish, unpublish } =
    useAdminOfficialPublicOperationsPublishTab(entityType, statusFilter || undefined);

  return (
    <section aria-labelledby={titleId} data-tt-admin-public-operations-publish="1">
      <h2 id={titleId} className="sr-only">
        {t("admin_public_operations_tab_publish")}
      </h2>
      <AdminOpsRiskBanner messageKey="admin_public_operations_publish_risk_banner" />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_public_operations_publish_entity_type")}</span>
          <select
            className={ADMIN_FILTER_INPUT_SM_CLASS}
            value={entityType}
            onChange={(e) => setEntityType(e.target.value as PublicOpsEntityType)}
          >
            {ENTITY_TYPES.map((et) => (
              <option key={et} value={et}>
                {et}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_public_operations_publish_status_filter")}</span>
          <select
            className={ADMIN_FILTER_INPUT_SM_CLASS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">{t("admin_public_operations_publish_status_all")}</option>
            <option value="draft">draft</option>
            <option value="published">published</option>
            <option value="hidden">hidden</option>
          </select>
        </label>
        <button type="button" className={adminTableRowPrimaryActionClass()} disabled={busy} onClick={() => void reload()}>
          {t("admin_public_operations_stats_refresh")}
        </button>
      </div>
      <OpsPlaneFetchStates loading={loading} error={error} onRetry={() => void reload()}>
        <OfficialOpsDataTable dataAttr="public-operations-publish-list">
          <OfficialOpsTableHead>
            <tr>
              <OfficialOpsTableTh>{t("admin_public_operations_publish_col_label")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_public_operations_publish_col_display_status")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_public_operations_stats_col_origin")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_public_operations_publish_col_display_origin")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_content_col_actions")}</OfficialOpsTableTh>
            </tr>
          </OfficialOpsTableHead>
          <OfficialOpsTableBody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className={ADMIN_TABLE_TD_CELL_CLASS}>
                  {t("admin_public_operations_stats_empty")}
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.id}>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.label}</td>
                  <td className={`${ADMIN_TABLE_TD_CELL_CLASS} font-mono`}>{row.display_status}</td>
                  <td className={`${ADMIN_TABLE_TD_CELL_CLASS} font-mono`}>{row.data_origin}</td>
                  <td className={`${ADMIN_TABLE_TD_CELL_CLASS} font-mono`}>{row.display_origin}</td>
                  <td className={`${ADMIN_TABLE_TD_CELL_CLASS} space-x-2`}>
                    {row.display_status !== "published" ? (
                      <button
                        type="button"
                        disabled={busy}
                        className="underline"
                        data-tt-admin-public-operations-publish-action="1"
                        onClick={() => requestConfirm(adminConfirmOfficialPublish(() => publish(row)))}
                      >
                        {t("admin_public_operations_action_publish")}
                      </button>
                    ) : null}
                    {row.display_status === "published" ? (
                      <button
                        type="button"
                        disabled={busy}
                        className="underline"
                        data-tt-admin-public-operations-unpublish-action="1"
                        onClick={() => void unpublish(row)}
                      >
                        {t("admin_public_operations_action_unpublish")}
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </OfficialOpsTableBody>
        </OfficialOpsDataTable>
      </OpsPlaneFetchStates>
    </section>
  );
}
