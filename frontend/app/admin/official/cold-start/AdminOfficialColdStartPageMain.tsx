"use client";

import { useId, useMemo, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminOpsPlanePermissionBanners } from "@/components/admin/ops/AdminOpsPlanePermissionBanners";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import {
  OfficialOpsDataTable,
  OfficialOpsTableBody,
  OfficialOpsTableHead,
  OfficialOpsTableTh,
} from "@/components/admin/ops/OfficialOpsDataTable";
import { OfficialOpsFormCard } from "@/components/admin/ops/OfficialOpsFormCard";

import { OfficialOpsPublishRowActions, type OfficialOpsPublishAction } from "@/components/admin/ops/OfficialOpsPublishRowActions";
import { OpsPlaneFetchStates } from "@/components/admin/ops/OpsPlaneFetchStates";
import { AdminOpsRiskBanner } from "@/components/admin/ops/AdminOpsRiskBanner";
import {
  OFFICIAL_COLD_START_SURFACE_OPTIONS,
  type OfficialColdStartSurfaceId,
} from "@/lib/admin/officialOpsL5";
import {
  ADMIN_FILTER_FIELD_LABEL_CLASS,
  ADMIN_FILTER_INPUT_MD_CLASS,
  ADMIN_FILTER_HINT_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_TABLE_TD_CELL_CLASS,
} from "@/lib/adminUi";
import {
  postAdminOfficialColdStartCampaign,
  postAdminOfficialColdStartCampaignDeploy,
  postAdminOfficialColdStartCampaignItem,
  postAdminOfficialColdStartCampaignRequestDeploy,
  postAdminOfficialColdStartCampaignRollback,
  postAdminOfficialColdStartCampaignSubmitReview,
} from "@/lib/apiClient";

import { useAdminOfficialColdStartPage } from "./useAdminOfficialColdStartPage";

export function AdminOfficialColdStartPageMain() {
  const { t } = useTranslation();
  const titleId = useId();
  const { items, accounts, templates, loading, error, reload } = useAdminOfficialColdStartPage();
  const [name, setName] = useState("");
  const [selectedSurfaces, setSelectedSurfaces] = useState<OfficialColdStartSurfaceId[]>([
    "home_hero",
    "market_feed",
  ]);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [itemType, setItemType] = useState("official_account");
  const [itemRefId, setItemRefId] = useState("");
  const [busy, setBusy] = useState(false);

  const surfacesCsv = useMemo(() => selectedSurfaces.join(","), [selectedSurfaces]);

  function toggleSurface(id: OfficialColdStartSurfaceId) {
    setSelectedSurfaces((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (selectedSurfaces.length === 0) return;
    setBusy(true);
    try {
      await postAdminOfficialColdStartCampaign({
        name,
        surfaces: selectedSurfaces,
      });
      setName("");
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function onAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCampaignId || !itemRefId) return;
    setBusy(true);
    try {
      await postAdminOfficialColdStartCampaignItem(selectedCampaignId, {
        item_type: itemType,
        item_ref_id: itemRefId,
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
      if (action === "submit") await postAdminOfficialColdStartCampaignSubmitReview(id);
      if (action === "request") await postAdminOfficialColdStartCampaignRequestDeploy(id, {});
      if (action === "deploy") await postAdminOfficialColdStartCampaignDeploy(id);
      if (action === "rollback") await postAdminOfficialColdStartCampaignRollback(id);
      await reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminDetailPageChrome
      titleId={titleId}
      title={t("admin_official_cold_start_title")}
      subtitle={t("admin_official_cold_start_subtitle")}
    >
      <AdminOpsPlanePermissionBanners read={ADMIN_PERM.OFFICIAL_READ} write={ADMIN_PERM.OFFICIAL_WRITE} publish={ADMIN_PERM.OFFICIAL_PUBLISH} />

      <AdminOpsRiskBanner messageKey="admin_ops_risk_banner_cold_start" />

      {!loading && items.length === 0 ? (
        <p className={`mb-4 ${ADMIN_FILTER_HINT_CLASS}`} data-tt-admin-official-cold-start-empty-guide="1">
          {t("admin_official_cold_start_empty_guide")}
        </p>
      ) : null}

      <OfficialOpsFormCard title={t("admin_official_cold_start_create_title")} onSubmit={(e) => void onCreate(e)} dataAttr="cold-start-create">
        <label className={`md:col-span-2 ${ADMIN_FILTER_FIELD_LABEL_CLASS}`}>
          {t("admin_official_cold_start_field_name")}
          <input className={`mt-1 ${ADMIN_FILTER_INPUT_MD_CLASS}`} value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <fieldset className="md:col-span-2">
          <legend className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_official_cold_start_field_surfaces")}</legend>
          <p className={ADMIN_FILTER_HINT_CLASS}>{t("admin_official_cold_start_surfaces_hint")}</p>
          <div className="mt-2 flex flex-wrap gap-3">
            {OFFICIAL_COLD_START_SURFACE_OPTIONS.map((opt) => (
              <label key={opt.id} className="inline-flex min-h-[44px] items-center gap-2 text-small">
                <input
                  type="checkbox"
                  checked={selectedSurfaces.includes(opt.id)}
                  onChange={() => toggleSurface(opt.id)}
                />
                {t(opt.labelKey)}
              </label>
            ))}
          </div>
          <p className="mt-2 text-meta text-ink-500">{surfacesCsv || "—"}</p>
        </fieldset>
        <button type="submit" disabled={busy || selectedSurfaces.length === 0} className={`md:col-span-2 ${ADMIN_PRIMARY_ACTION_BTN_CLASS}`}>
          {t("admin_official_cold_start_action_create")}
        </button>
      </OfficialOpsFormCard>

      <OfficialOpsFormCard title={t("admin_official_cold_start_add_item_title")} onSubmit={(e) => void onAddItem(e)} dataAttr="cold-start-add-item">
        <label className={`md:col-span-1 ${ADMIN_FILTER_FIELD_LABEL_CLASS}`}>
          {t("admin_official_cold_start_field_campaign")}
          <select className={`mt-1 ${ADMIN_FILTER_INPUT_MD_CLASS}`} value={selectedCampaignId} onChange={(e) => setSelectedCampaignId(e.target.value)} required>
            <option value="">{t("admin_official_cold_start_field_campaign")}</option>
            {items.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.publish_status})
              </option>
            ))}
          </select>
        </label>
        <label className={`md:col-span-1 ${ADMIN_FILTER_FIELD_LABEL_CLASS}`}>
          {t("admin_official_cold_start_item_type")}
          <select
            className={`mt-1 ${ADMIN_FILTER_INPUT_MD_CLASS}`}
            value={itemType}
            onChange={(e) => {
              setItemType(e.target.value);
              setItemRefId("");
            }}
          >
            <option value="official_account">{t("admin_official_cold_start_item_account")}</option>
            <option value="itinerary_template">{t("admin_official_cold_start_item_template")}</option>
          </select>
        </label>
        <label className={`md:col-span-2 ${ADMIN_FILTER_FIELD_LABEL_CLASS}`}>
          {t("admin_official_cold_start_field_item_ref")}
          <select className={`mt-1 ${ADMIN_FILTER_INPUT_MD_CLASS}`} value={itemRefId} onChange={(e) => setItemRefId(e.target.value)} required>
            <option value="">{t("admin_official_cold_start_field_item_ref")}</option>
            {itemType === "official_account"
              ? accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.display_label}
                  </option>
                ))
              : templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.title}
                  </option>
                ))}
          </select>
        </label>
        <button type="submit" disabled={busy || !selectedCampaignId || !itemRefId} className={`md:col-span-2 ${ADMIN_PRIMARY_ACTION_BTN_CLASS}`}>
          {t("admin_official_cold_start_action_add_item")}
        </button>
      </OfficialOpsFormCard>

      <OpsPlaneFetchStates loading={loading} error={error} onRetry={() => void reload()} loadingMessageKey="admin_official_loading" empty={!loading && !error && items.length === 0} emptyMessageKey="ops_plane_empty" skeleton>
        <OfficialOpsDataTable dataAttr="cold-start">
          <OfficialOpsTableHead>
            <tr>
              <OfficialOpsTableTh>{t("admin_official_cold_start_col_name")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_official_cold_start_col_surfaces")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_official_cold_start_col_publish")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_official_cold_start_col_deploy")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_official_col_actions")}</OfficialOpsTableTh>
            </tr>
          </OfficialOpsTableHead>
          <OfficialOpsTableBody>
            {items.map((row) => (
              <tr key={row.id}>
                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.name}</td>
                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{(row.surfaces ?? []).join(", ") || "—"}</td>
                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.publish_status}</td>
                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.status}</td>
                <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                  <OfficialOpsPublishRowActions
                    busy={busy}
                    show={{ submit: true, request: true, publish: false, deploy: true, rollback: true }}
                    requestLabelKey="admin_official_cold_start_action_request_deploy"
                    onAction={(action) => void runAction(row.id, action)}
                  />
                </td>
              </tr>
            ))}
          </OfficialOpsTableBody>
        </OfficialOpsDataTable>
      </OpsPlaneFetchStates>
    </AdminDetailPageChrome>
  );
}
