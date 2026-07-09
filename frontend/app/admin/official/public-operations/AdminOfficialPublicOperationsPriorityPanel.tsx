"use client";

import { useId, useState } from "react";

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
import { patchAdminOfficialPublicOperationsPriority } from "@/lib/apiClient";

import {
  useAdminOfficialPublicOperationsDisplayList,
  type PublicOpsEntityType,
} from "./useAdminOfficialPublicOperationsDisplayList";

const ENTITY_TYPES: PublicOpsEntityType[] = ["guides", "orders", "market_listings", "community_posts"];

export function AdminOfficialPublicOperationsPriorityPanel() {
  const { t } = useTranslation();
  const titleId = useId();
  const [entityType, setEntityType] = useState<PublicOpsEntityType>("guides");
  const [busy, setBusy] = useState(false);
  const [editPriority, setEditPriority] = useState<Record<string, string>>({});
  const { items, loading, error, reload } = useAdminOfficialPublicOperationsDisplayList(entityType, {
    displayStatus: "published",
  });

  async function savePriority(row: { id: string; entity_type: string; display_priority: number }) {
    const raw = editPriority[row.id] ?? String(row.display_priority);
    const next = Number.parseInt(raw, 10);
    if (Number.isNaN(next)) return;
    setBusy(true);
    try {
      const res = await patchAdminOfficialPublicOperationsPriority(row.entity_type, row.id, next);
      if (res.status === "ok") await reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby={titleId} data-tt-admin-public-operations-priority="1">
      <h2 id={titleId} className="sr-only">
        {t("admin_public_operations_tab_priority")}
      </h2>
      <AdminOpsRiskBanner messageKey="admin_public_operations_priority_risk_banner" variant="info" />
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
        <button type="button" className={adminTableRowPrimaryActionClass()} disabled={busy} onClick={() => void reload()}>
          {t("admin_public_operations_stats_refresh")}
        </button>
      </div>
      <OpsPlaneFetchStates loading={loading} error={error} onRetry={() => void reload()}>
        <OfficialOpsDataTable dataAttr="public-operations-priority-list">
          <OfficialOpsTableHead>
            <tr>
              <OfficialOpsTableTh>{t("admin_public_operations_publish_col_label")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_public_operations_col_featured")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_public_operations_col_priority")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_content_col_actions")}</OfficialOpsTableTh>
            </tr>
          </OfficialOpsTableHead>
          <OfficialOpsTableBody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className={ADMIN_TABLE_TD_CELL_CLASS}>
                  {t("admin_public_operations_stats_empty")}
                </td>
              </tr>
            ) : (
              items.map((row) => {
                const value = editPriority[row.id] ?? String(row.display_priority);
                return (
                  <tr key={row.id}>
                    <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.label}</td>
                    <td className={`${ADMIN_TABLE_TD_CELL_CLASS} font-mono`}>{row.featured ? "true" : "false"}</td>
                    <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                      <input
                        className={`w-20 ${ADMIN_FILTER_INPUT_SM_CLASS}`}
                        value={value}
                        onChange={(e) => setEditPriority((prev) => ({ ...prev, [row.id]: e.target.value }))}
                      />
                    </td>
                    <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                      <button
                        type="button"
                        disabled={busy}
                        className="underline"
                        data-tt-admin-public-operations-priority-save="1"
                        onClick={() => void savePriority(row)}
                      >
                        {t("admin_content_action_save")}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </OfficialOpsTableBody>
        </OfficialOpsDataTable>
      </OpsPlaneFetchStates>
    </section>
  );
}
