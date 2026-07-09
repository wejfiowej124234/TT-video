"use client";

import { useId, useMemo, useState } from "react";

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
import { PUBLIC_OPS_ENTITY_SURFACE_OPTIONS } from "@/lib/admin/officialOpsL5";
import {
  ADMIN_FILTER_FIELD_LABEL_CLASS,
  ADMIN_FILTER_INPUT_SM_CLASS,
  ADMIN_TABLE_TD_CELL_CLASS,
  adminTableRowPrimaryActionClass,
} from "@/lib/adminUi";
import { patchAdminOfficialPublicOperationsSurfaces } from "@/lib/apiClient";

import {
  useAdminOfficialPublicOperationsDisplayList,
  type PublicOpsEntityType,
} from "./useAdminOfficialPublicOperationsDisplayList";

const ENTITY_TYPES: PublicOpsEntityType[] = ["guides", "orders", "market_listings", "community_posts"];

export function AdminOfficialPublicOperationsSurfacePanel() {
  const { t } = useTranslation();
  const titleId = useId();
  const requestConfirm = useAdminL5ConfirmRequest();
  const [entityType, setEntityType] = useState<PublicOpsEntityType>("guides");
  const [busy, setBusy] = useState(false);
  const [draftSurfaces, setDraftSurfaces] = useState<Record<string, string[]>>({});
  const { items, loading, error, reload } = useAdminOfficialPublicOperationsDisplayList(entityType, {
    displayStatus: "published",
  });

  const surfaceLabels = useMemo(
    () =>
      Object.fromEntries(
        PUBLIC_OPS_ENTITY_SURFACE_OPTIONS.map((opt) => [opt.id, t(opt.labelKey)]),
      ) as Record<string, string>,
    [t],
  );

  function surfacesForRow(rowId: string, current: string[]) {
    return draftSurfaces[rowId] ?? current;
  }

  function toggleSurface(rowId: string, current: string[], surfaceId: string) {
    const base = surfacesForRow(rowId, current);
    const next = base.includes(surfaceId)
      ? base.filter((s) => s !== surfaceId)
      : [...base, surfaceId];
    setDraftSurfaces((prev) => ({ ...prev, [rowId]: next }));
  }

  async function saveSurfaces(row: { id: string; entity_type: string; display_surfaces: string[] }) {
    const next = surfacesForRow(row.id, row.display_surfaces);
    setBusy(true);
    try {
      const res = await patchAdminOfficialPublicOperationsSurfaces(row.entity_type, row.id, next);
      if (res.status === "ok") {
        setDraftSurfaces((prev) => {
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
    <section aria-labelledby={titleId} data-tt-admin-public-operations-surface="1">
      <h2 id={titleId} className="sr-only">
        {t("admin_public_operations_tab_surface")}
      </h2>
      <AdminOpsRiskBanner messageKey="admin_public_operations_surface_risk_banner" />
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
        <OfficialOpsDataTable dataAttr="public-operations-surface-list">
          <OfficialOpsTableHead>
            <tr>
              <OfficialOpsTableTh>{t("admin_public_operations_publish_col_label")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_public_operations_col_surfaces")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_content_col_actions")}</OfficialOpsTableTh>
            </tr>
          </OfficialOpsTableHead>
          <OfficialOpsTableBody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={3} className={ADMIN_TABLE_TD_CELL_CLASS}>
                  {t("admin_public_operations_stats_empty")}
                </td>
              </tr>
            ) : (
              items.map((row) => {
                const selected = surfacesForRow(row.id, row.display_surfaces ?? []);
                return (
                  <tr key={row.id}>
                    <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.label}</td>
                    <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                      <div className="flex flex-wrap gap-2">
                        {PUBLIC_OPS_ENTITY_SURFACE_OPTIONS.map((opt) => (
                          <label key={opt.id} className="flex items-center gap-1 text-small">
                            <input
                              type="checkbox"
                              checked={selected.includes(opt.id)}
                              disabled={busy}
                              onChange={() => toggleSurface(row.id, row.display_surfaces ?? [], opt.id)}
                            />
                            {surfaceLabels[opt.id] ?? opt.id}
                          </label>
                        ))}
                      </div>
                    </td>
                    <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                      <button
                        type="button"
                        disabled={busy}
                        className="underline"
                        data-tt-admin-public-operations-surface-save="1"
                        onClick={() =>
                          requestConfirm(
                            adminConfirmOfficialPublish(() => saveSurfaces(row)),
                          )
                        }
                      >
                        {t("admin_public_operations_action_save_surfaces")}
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
