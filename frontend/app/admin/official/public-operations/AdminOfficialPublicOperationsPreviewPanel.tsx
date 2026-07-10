"use client";

import { useId, useMemo, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminOpsRiskBanner } from "@/components/admin/ops/AdminOpsRiskBanner";
import {
  OfficialOpsDataTable,
  OfficialOpsTableBody,
  OfficialOpsTableHead,
  OfficialOpsTableTh,
} from "@/components/admin/ops/OfficialOpsDataTable";
import { OpsPlaneFetchStates } from "@/components/admin/ops/OpsPlaneFetchStates";
import { PUBLIC_OPS_ENTITY_SURFACE_OPTIONS } from "@/lib/admin/officialOpsL5";
import {
  ADMIN_FILTER_FIELD_LABEL_CLASS,
  ADMIN_FILTER_INPUT_SM_CLASS,
  ADMIN_TABLE_TD_CELL_CLASS,
  adminTableRowPrimaryActionClass,
} from "@/lib/adminUi";
import { getAdminOfficialPublicOperationsPreview } from "@/lib/apiClient";
import type { AdminPublicOpsPreviewResult } from "@/lib/apiClient/official/http";

import {
  useAdminOfficialPublicOperationsDisplayList,
  type PublicOpsEntityType,
} from "./useAdminOfficialPublicOperationsDisplayList";

const ENTITY_TYPES: PublicOpsEntityType[] = ["guides", "orders", "market_listings", "community_posts"];

function datetimeLocalToIso(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function AdminOfficialPublicOperationsPreviewPanel() {
  const { t } = useTranslation();
  const titleId = useId();
  const [entityType, setEntityType] = useState<PublicOpsEntityType>("guides");
  const [surface, setSurface] = useState("market_feed");
  const [asOfLocal, setAsOfLocal] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<AdminPublicOpsPreviewResult | null>(null);
  const [publicCard, setPublicCard] = useState<unknown>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const { items, loading, error, reload } = useAdminOfficialPublicOperationsDisplayList(entityType, {
    limit: 50,
  });

  const surfaceLabels = useMemo(
    () =>
      Object.fromEntries(
        PUBLIC_OPS_ENTITY_SURFACE_OPTIONS.map((opt) => [opt.id, t(opt.labelKey)]),
      ) as Record<string, string>,
    [t],
  );

  async function runPreview() {
    if (!selectedId) return;
    setBusy(true);
    setPreviewError(null);
    try {
      const as_of = datetimeLocalToIso(asOfLocal);
      const res = await getAdminOfficialPublicOperationsPreview(entityType, selectedId, {
        surface,
        as_of,
      });
      if (res.status === "ok" && res.preview) {
        setPreview(res.preview);
        setPublicCard(res.public_card ?? null);
      } else {
        setPreview(null);
        setPublicCard(null);
        setPreviewError(res.error ?? "admin_public_operations_preview_failed");
      }
    } catch {
      setPreview(null);
      setPublicCard(null);
      setPreviewError("admin_public_operations_preview_failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby={titleId} data-tt-admin-public-operations-preview="1">
      <h2 id={titleId} className="sr-only">
        {t("admin_public_operations_tab_preview")}
      </h2>
      <AdminOpsRiskBanner messageKey="admin_public_operations_preview_risk_banner" variant="info" />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_public_operations_publish_entity_type")}</span>
          <select
            className={ADMIN_FILTER_INPUT_SM_CLASS}
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value as PublicOpsEntityType);
              setSelectedId("");
              setPreview(null);
            }}
          >
            {ENTITY_TYPES.map((et) => (
              <option key={et} value={et}>
                {et}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_public_operations_preview_entity")}</span>
          <select
            className={ADMIN_FILTER_INPUT_SM_CLASS}
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">{t("admin_public_operations_preview_entity_placeholder")}</option>
            {items.map((row) => (
              <option key={row.id} value={row.id}>
                {row.label} · {row.display_status}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_public_operations_preview_surface")}</span>
          <select
            className={ADMIN_FILTER_INPUT_SM_CLASS}
            value={surface}
            onChange={(e) => setSurface(e.target.value)}
          >
            {PUBLIC_OPS_ENTITY_SURFACE_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {surfaceLabels[opt.id] ?? opt.id}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_public_operations_preview_as_of")}</span>
          <input
            type="datetime-local"
            className={ADMIN_FILTER_INPUT_SM_CLASS}
            value={asOfLocal}
            onChange={(e) => setAsOfLocal(e.target.value)}
          />
        </label>
        <button
          type="button"
          className={adminTableRowPrimaryActionClass()}
          disabled={busy || !selectedId}
          data-tt-admin-public-operations-preview-run="1"
          onClick={() => void runPreview()}
        >
          {t("admin_public_operations_action_run_preview")}
        </button>
        <button type="button" className={adminTableRowPrimaryActionClass()} disabled={loading} onClick={() => void reload()}>
          {t("admin_public_operations_stats_refresh")}
        </button>
      </div>
      <OpsPlaneFetchStates loading={loading} error={error} onRetry={() => void reload()}>
        {previewError ? (
          <p className="text-small text-red-700" role="alert">
            {t(previewError)}
          </p>
        ) : null}
        {preview ? (
          <div data-tt-admin-public-operations-preview-result="1">
            <OfficialOpsDataTable dataAttr="public-operations-preview-checks">
              <OfficialOpsTableHead>
                <tr>
                  <OfficialOpsTableTh>{t("admin_public_operations_preview_col_check")}</OfficialOpsTableTh>
                  <OfficialOpsTableTh>{t("admin_public_operations_preview_col_pass")}</OfficialOpsTableTh>
                </tr>
              </OfficialOpsTableHead>
              <OfficialOpsTableBody>
                <tr>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>display_status = published</td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                    {preview.checks.display_status_published ? "✓" : "✗"}
                  </td>
                </tr>
                <tr>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>surface match</td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{preview.checks.surface_match ? "✓" : "✗"}</td>
                </tr>
                <tr>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>schedule window</td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{preview.checks.schedule_in_window ? "✓" : "✗"}</td>
                </tr>
                <tr>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>test policy origin</td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                    {preview.checks.policy_origin_allowed ? "✓" : "✗"}
                  </td>
                </tr>
                <tr>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{t("admin_public_operations_preview_col_visible")}</td>
                  <td className={`${ADMIN_TABLE_TD_CELL_CLASS} font-semibold`}>
                    {preview.visible ? t("admin_public_operations_preview_visible_yes") : t("admin_public_operations_preview_visible_no")}
                  </td>
                </tr>
              </OfficialOpsTableBody>
            </OfficialOpsDataTable>
            {preview.reasons_hidden.length > 0 ? (
              <p className="mt-3 text-small text-ink-600">
                {t("admin_public_operations_preview_reasons")}: {preview.reasons_hidden.join(", ")}
              </p>
            ) : null}
            {publicCard ? (
              <pre className="mt-4 max-h-64 overflow-auto rounded border border-ink-200 bg-ink-50 p-3 text-meta">
                {JSON.stringify(publicCard, null, 2)}
              </pre>
            ) : null}
          </div>
        ) : (
          <p className="text-small text-ink-600">{t("admin_public_operations_preview_empty_hint")}</p>
        )}
      </OpsPlaneFetchStates>
    </section>
  );
}
