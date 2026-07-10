"use client";

import { useId, useState } from "react";

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

import { AdminOpsRiskBanner } from "@/components/admin/ops/AdminOpsRiskBanner";
import { OfficialOpsPublishRowActions, type OfficialOpsPublishAction } from "@/components/admin/ops/OfficialOpsPublishRowActions";
import { OpsPlaneFetchStates } from "@/components/admin/ops/OpsPlaneFetchStates";
import {
  ADMIN_FILTER_FIELD_LABEL_CLASS,
  ADMIN_FILTER_INPUT_MD_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_TABLE_TD_CELL_CLASS,
} from "@/lib/adminUi";
import {
  postAdminOfficialItineraryTemplate,
  postAdminOfficialItineraryTemplatePublish,
  postAdminOfficialItineraryTemplateRequestPublish,
  postAdminOfficialItineraryTemplateSubmitReview,
} from "@/lib/apiClient";

import { useAdminOfficialItineraryTemplatesPage } from "./useAdminOfficialItineraryTemplatesPage";

export function AdminOfficialItineraryTemplatesPageMain() {
  const { t } = useTranslation();
  const titleId = useId();
  const { items, accounts, loading, error, reload } = useAdminOfficialItineraryTemplatesPage();
  const [authorAccountId, setAuthorAccountId] = useState("");
  const [title, setTitle] = useState("");
  const [countryIso, setCountryIso] = useState("");
  const [cityId, setCityId] = useState("");
  const [daysJson, setDaysJson] = useState("[]");
  const [busy, setBusy] = useState(false);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!authorAccountId) return;
    setBusy(true);
    try {
      let parsedDays: unknown = [];
      try {
        parsedDays = JSON.parse(daysJson) as unknown;
      } catch {
        parsedDays = [];
      }
      await postAdminOfficialItineraryTemplate({
        author_account_id: authorAccountId,
        title,
        country_iso: countryIso.trim() || undefined,
        city_id: cityId.trim() || undefined,
        days_json: parsedDays,
      });
      setTitle("");
      setCountryIso("");
      setCityId("");
      setDaysJson("[]");
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function runAction(id: string, action: OfficialOpsPublishAction) {
    setBusy(true);
    try {
      if (action === "submit") await postAdminOfficialItineraryTemplateSubmitReview(id);
      if (action === "request") await postAdminOfficialItineraryTemplateRequestPublish(id, {});
      if (action === "publish") await postAdminOfficialItineraryTemplatePublish(id);
      await reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminDetailPageChrome
      titleId={titleId}
      title={t("admin_official_templates_title")}
      subtitle={t("admin_official_templates_subtitle")}
    >
      <AdminOpsPlanePermissionBanners read={ADMIN_PERM.OFFICIAL_READ} write={ADMIN_PERM.OFFICIAL_WRITE} publish={ADMIN_PERM.OFFICIAL_PUBLISH} />

      <AdminOpsRiskBanner messageKey="admin_ops_risk_banner_official_publish" variant="warning" />

      <OfficialOpsFormCard title={t("admin_official_templates_create_title")} onSubmit={(e) => void onCreate(e)} dataAttr="templates-create">
        <label className={`md:col-span-2 ${ADMIN_FILTER_FIELD_LABEL_CLASS}`}>
          {t("admin_official_templates_field_author")}
          <select className={`mt-1 ${ADMIN_FILTER_INPUT_MD_CLASS}`} value={authorAccountId} onChange={(e) => setAuthorAccountId(e.target.value)} required>
            <option value="">{t("admin_official_templates_field_author")}</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.display_label} ({acc.user_email ?? acc.id})
              </option>
            ))}
          </select>
        </label>
        <label className={`md:col-span-2 ${ADMIN_FILTER_FIELD_LABEL_CLASS}`}>
          {t("admin_official_templates_field_title")}
          <input className={`mt-1 ${ADMIN_FILTER_INPUT_MD_CLASS}`} value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label className={`md:col-span-1 ${ADMIN_FILTER_FIELD_LABEL_CLASS}`}>
          {t("admin_official_templates_field_country")}
          <input className={`mt-1 ${ADMIN_FILTER_INPUT_MD_CLASS}`} value={countryIso} onChange={(e) => setCountryIso(e.target.value.toUpperCase())} maxLength={2} />
        </label>
        <label className={`md:col-span-1 ${ADMIN_FILTER_FIELD_LABEL_CLASS}`}>
          {t("admin_official_templates_field_city_id")}
          <input className={`mt-1 ${ADMIN_FILTER_INPUT_MD_CLASS}`} value={cityId} onChange={(e) => setCityId(e.target.value)} />
        </label>
        <label className={`md:col-span-2 ${ADMIN_FILTER_FIELD_LABEL_CLASS}`}>
          {t("admin_official_templates_field_days_json")}
          <textarea className={`mt-1 font-mono text-meta ${ADMIN_FILTER_INPUT_MD_CLASS}`} value={daysJson} onChange={(e) => setDaysJson(e.target.value)} rows={3} />
        </label>
        <button type="submit" disabled={busy || !authorAccountId} className={`md:col-span-2 ${ADMIN_PRIMARY_ACTION_BTN_CLASS}`}>
          {t("admin_official_templates_action_create")}
        </button>
      </OfficialOpsFormCard>

      <OpsPlaneFetchStates loading={loading} error={error} onRetry={() => void reload()} loadingMessageKey="admin_official_loading" empty={!loading && !error && items.length === 0} emptyMessageKey="ops_plane_empty" skeleton>
        <OfficialOpsDataTable dataAttr="templates">
          <OfficialOpsTableHead>
            <tr>
              <OfficialOpsTableTh>{t("admin_official_templates_col_title")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_official_templates_col_author")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_official_templates_col_catalog")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_official_templates_col_status")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_official_col_actions")}</OfficialOpsTableTh>
            </tr>
          </OfficialOpsTableHead>
          <OfficialOpsTableBody>
            {items.map((row) => (
              <tr key={row.id}>
                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.title}</td>
                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.author_display_label ?? row.author_user_email ?? "—"}</td>
                <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                  {row.country_iso ?? "—"}
                  {row.city_name_zh ? ` · ${row.city_name_zh}` : row.city_id ? ` · ${row.city_id.slice(0, 8)}…` : ""}
                </td>
                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.publish_status}</td>
                <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                  <OfficialOpsPublishRowActions
                    busy={busy}
                    publishLabelKey="admin_official_templates_action_publish"
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
