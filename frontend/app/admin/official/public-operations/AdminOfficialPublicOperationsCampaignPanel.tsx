"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminOpsRiskBanner } from "@/components/admin/ops/AdminOpsRiskBanner";
import { OfficialOpsPublishRowActions, type OfficialOpsPublishAction } from "@/components/admin/ops/OfficialOpsPublishRowActions";
import {
  OfficialOpsDataTable,
  OfficialOpsTableBody,
  OfficialOpsTableHead,
  OfficialOpsTableTh,
} from "@/components/admin/ops/OfficialOpsDataTable";
import { OfficialOpsFormCard } from "@/components/admin/ops/OfficialOpsFormCard";
import { OpsPlaneFetchStates } from "@/components/admin/ops/OpsPlaneFetchStates";
import {
  PUBLIC_OPS_CAMPAIGN_DEFAULT_SURFACES,
  PUBLIC_OPS_CAMPAIGN_ENTITY_ITEM_TYPES,
  PUBLIC_OPS_CAMPAIGN_KINDS,
  type PublicOpsCampaignKindId,
} from "@/lib/admin/officialOpsCampaign";
import {
  ADMIN_FILTER_FIELD_LABEL_CLASS,
  ADMIN_FILTER_HINT_CLASS,
  ADMIN_FILTER_INPUT_MD_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_TABLE_TD_CELL_CLASS,
  adminTableRowPrimaryActionClass,
} from "@/lib/adminUi";
import {
  getAdminOfficialPublicOperationsCampaignPreview,
  getAdminOfficialPublicOperationsCampaigns,
  postAdminOfficialPublicOperationsCampaign,
  postAdminOfficialPublicOperationsCampaignDeploy,
  postAdminOfficialPublicOperationsCampaignItem,
  postAdminOfficialPublicOperationsCampaignRequestDeploy,
  postAdminOfficialPublicOperationsCampaignRollback,
  postAdminOfficialPublicOperationsCampaignSubmitReview,
} from "@/lib/apiClient";
import type { AdminPublicOpsCampaignPreview, AdminPublicOpsCampaignRow } from "@/lib/apiClient/official/http";

export function AdminOfficialPublicOperationsCampaignPanel() {
  const { t } = useTranslation();
  const titleId = useId();
  const [kind, setKind] = useState<PublicOpsCampaignKindId>("homepage");
  const [items, setItems] = useState<AdminPublicOpsCampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [itemType, setItemType] = useState<string>("guide");
  const [itemRefId, setItemRefId] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<AdminPublicOpsCampaignPreview | null>(null);
  const [previewSurface, setPreviewSurface] = useState("");

  const defaultSurfaces = useMemo(() => PUBLIC_OPS_CAMPAIGN_DEFAULT_SURFACES[kind], [kind]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminOfficialPublicOperationsCampaigns({ campaign_kind: kind, limit: 50 });
      if (res.status === "ok") {
        setItems(res.items ?? []);
      } else {
        setError("admin_public_operations_campaign_load_failed");
      }
    } catch {
      setError("admin_public_operations_campaign_load_failed");
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    void reload();
    setPreviewSurface(defaultSurfaces[0] ?? "market_feed");
  }, [reload, defaultSurfaces]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await postAdminOfficialPublicOperationsCampaign({
        name: name.trim(),
        campaign_kind: kind,
        surfaces: defaultSurfaces,
      });
      setName("");
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function onAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCampaignId || !itemRefId.trim()) return;
    setBusy(true);
    try {
      await postAdminOfficialPublicOperationsCampaignItem(selectedCampaignId, {
        item_type: itemType,
        item_ref_id: itemRefId.trim(),
      });
      setItemRefId("");
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function runAction(id: string, action: OfficialOpsPublishAction) {
    setBusy(true);
    try {
      if (action === "submit") await postAdminOfficialPublicOperationsCampaignSubmitReview(id);
      if (action === "request") await postAdminOfficialPublicOperationsCampaignRequestDeploy(id, {});
      if (action === "deploy" || action === "publish") await postAdminOfficialPublicOperationsCampaignDeploy(id);
      if (action === "rollback") await postAdminOfficialPublicOperationsCampaignRollback(id);
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function runPreview(campaignId: string) {
    setBusy(true);
    try {
      const res = await getAdminOfficialPublicOperationsCampaignPreview(campaignId, {
        surface: previewSurface || undefined,
      });
      if (res.status === "ok" && res.preview) {
        setPreview(res.preview);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby={titleId} data-tt-admin-public-operations-campaign="1">
      <h2 id={titleId} className="sr-only">
        {t("admin_public_operations_tab_campaign")}
      </h2>
      <AdminOpsRiskBanner messageKey="admin_public_operations_campaign_risk_banner" variant="warning" />
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label={t("admin_public_operations_campaign_kind_tabs")}>
        {PUBLIC_OPS_CAMPAIGN_KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            role="tab"
            aria-selected={kind === k.id}
            className={
              kind === k.id
                ? "rounded-md bg-ink-900 px-3 py-1.5 text-small font-semibold text-white"
                : "rounded-md border border-ink-200 px-3 py-1.5 text-small text-ink-700"
            }
            onClick={() => setKind(k.id)}
            data-tt-admin-public-operations-campaign-kind={k.id}
          >
            {t(k.labelKey)}
          </button>
        ))}
      </div>
      <p className={`mb-4 ${ADMIN_FILTER_HINT_CLASS}`}>
        {t("admin_public_operations_campaign_kind_hint")}: {defaultSurfaces.join(", ")}
      </p>
      <OfficialOpsFormCard title={t("admin_public_operations_campaign_create_title")}>
        <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => void onCreate(e)}>
          <label className="flex min-w-[12rem] flex-1 flex-col gap-1">
            <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_public_operations_campaign_name")}</span>
            <input
              className={ADMIN_FILTER_INPUT_MD_CLASS}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
              required
            />
          </label>
          <button type="submit" className={ADMIN_PRIMARY_ACTION_BTN_CLASS} disabled={busy}>
            {t("admin_public_operations_campaign_create")}
          </button>
        </form>
      </OfficialOpsFormCard>
      <OpsPlaneFetchStates loading={loading} error={error} onRetry={() => void reload()}>
        <OfficialOpsDataTable className="mt-6" dataAttr="public-operations-campaign-list">
          <OfficialOpsTableHead>
            <tr>
              <OfficialOpsTableTh>{t("admin_public_operations_campaign_col_name")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_public_operations_campaign_col_status")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_public_operations_campaign_col_publish")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_public_operations_campaign_col_surfaces")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_public_operations_campaign_col_actions")}</OfficialOpsTableTh>
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
                <tr key={row.id} data-tt-admin-public-operations-campaign-row={row.id}>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.name}</td>
                  <td className={`${ADMIN_TABLE_TD_CELL_CLASS} font-mono text-meta`}>{row.status}</td>
                  <td className={`${ADMIN_TABLE_TD_CELL_CLASS} font-mono text-meta`}>{row.publish_status}</td>
                  <td className={`${ADMIN_TABLE_TD_CELL_CLASS} font-mono text-meta`}>
                    {(row.surfaces ?? []).join(", ") || "—"}
                  </td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                    <OfficialOpsPublishRowActions
                      busy={busy}
                      show={{
                        submit: row.publish_status === "draft",
                        request: row.publish_status === "in_review",
                        publish: false,
                        deploy: row.publish_status === "in_review",
                        rollback: row.status === "deployed",
                      }}
                      onAction={(action) => void runAction(row.id, action)}
                    />
                    <button
                      type="button"
                      className={`${adminTableRowPrimaryActionClass()} ml-2`}
                      disabled={busy}
                      onClick={() => {
                        setSelectedCampaignId(row.id);
                        void runPreview(row.id);
                      }}
                    >
                      {t("admin_public_operations_tab_preview")}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </OfficialOpsTableBody>
        </OfficialOpsDataTable>
      </OpsPlaneFetchStates>
      <OfficialOpsFormCard className="mt-6" title={t("admin_public_operations_campaign_add_item_title")}>
        <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => void onAddItem(e)}>
          <label className="flex flex-col gap-1">
            <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_public_operations_campaign_select")}</span>
            <select
              className={ADMIN_FILTER_INPUT_MD_CLASS}
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              disabled={busy}
            >
              <option value="">{t("admin_public_operations_publish_status_all")}</option>
              {items.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_public_operations_campaign_item_type")}</span>
            <select
              className={ADMIN_FILTER_INPUT_MD_CLASS}
              value={itemType}
              onChange={(e) => setItemType(e.target.value)}
              disabled={busy}
            >
              {PUBLIC_OPS_CAMPAIGN_ENTITY_ITEM_TYPES.map((et) => (
                <option key={et} value={et}>
                  {et}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[14rem] flex-1 flex-col gap-1">
            <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>entity_id</span>
            <input
              className={ADMIN_FILTER_INPUT_MD_CLASS}
              value={itemRefId}
              onChange={(e) => setItemRefId(e.target.value)}
              disabled={busy}
              placeholder="UUID"
            />
          </label>
          <button type="submit" className={ADMIN_PRIMARY_ACTION_BTN_CLASS} disabled={busy || !selectedCampaignId}>
            {t("admin_public_operations_campaign_add_item")}
          </button>
        </form>
      </OfficialOpsFormCard>
      {preview ? (
        <div className="mt-6 rounded border border-ink-200 p-4" data-tt-admin-public-operations-campaign-preview="1">
          <p className="text-body font-semibold text-ink-900">{preview.name}</p>
          <p className="mt-1 text-small text-ink-600">
            surface={preview.surface} · match={preview.surface_match ? "yes" : "no"} · items=
            {preview.item_count}
          </p>
        </div>
      ) : null}
    </section>
  );
}
