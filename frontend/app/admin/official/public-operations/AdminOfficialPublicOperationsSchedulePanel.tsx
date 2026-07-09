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
import {
  ADMIN_FILTER_FIELD_LABEL_CLASS,
  ADMIN_FILTER_INPUT_SM_CLASS,
  ADMIN_TABLE_TD_CELL_CLASS,
  adminTableRowPrimaryActionClass,
} from "@/lib/adminUi";
import { patchAdminOfficialPublicOperationsSchedule } from "@/lib/apiClient";

import {
  useAdminOfficialPublicOperationsDisplayList,
  type PublicOpsEntityType,
} from "./useAdminOfficialPublicOperationsDisplayList";

const ENTITY_TYPES: PublicOpsEntityType[] = ["guides", "orders", "market_listings", "community_posts"];

function isoToDatetimeLocal(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function datetimeLocalToIso(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function AdminOfficialPublicOperationsSchedulePanel() {
  const { t } = useTranslation();
  const titleId = useId();
  const requestConfirm = useAdminL5ConfirmRequest();
  const [entityType, setEntityType] = useState<PublicOpsEntityType>("guides");
  const [busy, setBusy] = useState(false);
  const [draftSchedule, setDraftSchedule] = useState<
    Record<string, { display_start_at: string; display_end_at: string }>
  >({});
  const { items, loading, error, reload } = useAdminOfficialPublicOperationsDisplayList(entityType, {
    displayStatus: "published",
  });

  function scheduleForRow(
    rowId: string,
    current: { display_start_at?: string | null; display_end_at?: string | null },
  ) {
    const draft = draftSchedule[rowId];
    if (draft) return draft;
    return {
      display_start_at: isoToDatetimeLocal(current.display_start_at),
      display_end_at: isoToDatetimeLocal(current.display_end_at),
    };
  }

  async function saveSchedule(row: {
    id: string;
    entity_type: string;
    display_start_at?: string | null;
    display_end_at?: string | null;
  }) {
    const fields = scheduleForRow(row.id, row);
    const display_start_at = datetimeLocalToIso(fields.display_start_at);
    const display_end_at = datetimeLocalToIso(fields.display_end_at);
    if (fields.display_start_at && display_start_at === null) return;
    if (fields.display_end_at && display_end_at === null) return;
    setBusy(true);
    try {
      const res = await patchAdminOfficialPublicOperationsSchedule(row.entity_type, row.id, {
        display_start_at,
        display_end_at,
      });
      if (res.status === "ok") {
        setDraftSchedule((prev) => {
          const copy = { ...prev };
          delete copy[row.id];
          return copy;
        });
        await reload();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby={titleId} data-tt-admin-public-operations-schedule="1">
      <h2 id={titleId} className="sr-only">
        {t("admin_public_operations_tab_schedule")}
      </h2>
      <AdminOpsRiskBanner messageKey="admin_public_operations_schedule_risk_banner" />
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
        <OfficialOpsDataTable dataAttr="public-operations-schedule-list">
          <OfficialOpsTableHead>
            <tr>
              <OfficialOpsTableTh>{t("admin_public_operations_publish_col_label")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_public_operations_col_display_start_at")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_public_operations_col_display_end_at")}</OfficialOpsTableTh>
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
                const fields = scheduleForRow(row.id, row);
                return (
                  <tr key={row.id}>
                    <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.label}</td>
                    <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                      <input
                        type="datetime-local"
                        className={ADMIN_FILTER_INPUT_SM_CLASS}
                        disabled={busy}
                        value={fields.display_start_at}
                        onChange={(e) =>
                          setDraftSchedule((prev) => ({
                            ...prev,
                            [row.id]: {
                              ...scheduleForRow(row.id, row),
                              display_start_at: e.target.value,
                            },
                          }))
                        }
                      />
                    </td>
                    <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                      <input
                        type="datetime-local"
                        className={ADMIN_FILTER_INPUT_SM_CLASS}
                        disabled={busy}
                        value={fields.display_end_at}
                        onChange={(e) =>
                          setDraftSchedule((prev) => ({
                            ...prev,
                            [row.id]: {
                              ...scheduleForRow(row.id, row),
                              display_end_at: e.target.value,
                            },
                          }))
                        }
                      />
                    </td>
                    <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                      <button
                        type="button"
                        disabled={busy}
                        className="underline"
                        data-tt-admin-public-operations-schedule-save="1"
                        onClick={() =>
                          requestConfirm(adminConfirmOfficialPublish(() => saveSchedule(row)))
                        }
                      >
                        {t("admin_public_operations_action_save_schedule")}
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
