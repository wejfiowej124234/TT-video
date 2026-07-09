"use client";

import { useCallback, useEffect, useId, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminOpsRiskBanner } from "@/components/admin/ops/AdminOpsRiskBanner";
import {
  OfficialOpsDataTable,
  OfficialOpsTableBody,
  OfficialOpsTableHead,
  OfficialOpsTableTh,
} from "@/components/admin/ops/OfficialOpsDataTable";
import { OpsPlaneFetchStates } from "@/components/admin/ops/OpsPlaneFetchStates";
import {
  ADMIN_FILTER_FIELD_LABEL_CLASS,
  ADMIN_FILTER_INPUT_SM_CLASS,
  ADMIN_TABLE_TD_CELL_CLASS,
  adminTableRowPrimaryActionClass,
} from "@/lib/adminUi";
import {
  getAdminOfficialPublicOperationsHistory,
  type AdminPublicOpsHistoryRow,
} from "@/lib/apiClient";

import { type PublicOpsEntityType } from "./useAdminOfficialPublicOperationsDisplayList";

const ENTITY_TYPES: PublicOpsEntityType[] = ["guides", "orders", "market_listings", "community_posts"];
const ACTIONS = ["publish", "unpublish", "featured", "priority", "surfaces", "schedule", "test_policy"] as const;

export function AdminOfficialPublicOperationsHistoryPanel() {
  const { t } = useTranslation();
  const titleId = useId();
  const [entityType, setEntityType] = useState<PublicOpsEntityType | "">("");
  const [action, setAction] = useState<string>("");
  const [items, setItems] = useState<AdminPublicOpsHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminOfficialPublicOperationsHistory({
        entity_type: entityType || undefined,
        action: action || undefined,
        limit: 50,
      });
      if (res.status === "ok") {
        setItems(res.items ?? []);
      } else {
        setError("admin_public_operations_history_load_failed");
      }
    } catch {
      setError("admin_public_operations_history_load_failed");
    } finally {
      setLoading(false);
    }
  }, [entityType, action]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <section aria-labelledby={titleId} data-tt-admin-public-operations-history="1">
      <h2 id={titleId} className="sr-only">
        {t("admin_public_operations_tab_history")}
      </h2>
      <AdminOpsRiskBanner messageKey="admin_public_operations_history_risk_banner" variant="info" />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_public_operations_publish_entity_type")}</span>
          <select
            className={ADMIN_FILTER_INPUT_SM_CLASS}
            value={entityType}
            onChange={(e) => setEntityType(e.target.value as PublicOpsEntityType | "")}
          >
            <option value="">{t("admin_public_operations_publish_status_all")}</option>
            {ENTITY_TYPES.map((et) => (
              <option key={et} value={et}>
                {et}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_public_operations_history_action_filter")}</span>
          <select
            className={ADMIN_FILTER_INPUT_SM_CLASS}
            value={action}
            onChange={(e) => setAction(e.target.value)}
          >
            <option value="">{t("admin_public_operations_publish_status_all")}</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className={adminTableRowPrimaryActionClass()} disabled={loading} onClick={() => void reload()}>
          {t("admin_public_operations_stats_refresh")}
        </button>
      </div>
      <OpsPlaneFetchStates loading={loading} error={error} onRetry={() => void reload()}>
        <OfficialOpsDataTable dataAttr="public-operations-history-list">
          <OfficialOpsTableHead>
            <tr>
              <OfficialOpsTableTh>{t("admin_public_operations_history_col_time")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_public_operations_history_col_action")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_public_operations_publish_entity_type")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_public_operations_history_col_entity")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_public_operations_history_col_actor")}</OfficialOpsTableTh>
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
                <tr key={row.id} data-tt-admin-public-operations-history-row="1">
                  <td className={`${ADMIN_TABLE_TD_CELL_CLASS} font-mono text-meta`}>
                    {row.created_at ? new Date(row.created_at).toLocaleString() : "—"}
                  </td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.action}</td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.entity_type}</td>
                  <td className={`${ADMIN_TABLE_TD_CELL_CLASS} font-mono text-meta`}>{row.entity_id}</td>
                  <td className={`${ADMIN_TABLE_TD_CELL_CLASS} font-mono text-meta`}>
                    {row.display_source ?? row.actor_id ?? "—"}
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
