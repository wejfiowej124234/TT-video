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
  postAdminOfficialGuide,
  postAdminOfficialGuidePublish,
  postAdminOfficialGuideRequestPublish,
  postAdminOfficialGuideSubmitReview,
} from "@/lib/apiClient";

import { useAdminOfficialGuidesPage } from "./useAdminOfficialGuidesPage";
import { AdminGuidesTriangleStrip } from "@/components/admin/AdminGuidesTriangleStrip";

export function AdminOfficialGuidesPageMain() {
  const { t } = useTranslation();
  const titleId = useId();
  const { items, accounts, loading, error, reload } = useAdminOfficialGuidesPage();
  const [authorAccountId, setAuthorAccountId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [destination, setDestination] = useState("");
  const [busy, setBusy] = useState(false);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!authorAccountId) return;
    setBusy(true);
    try {
      await postAdminOfficialGuide({
        author_account_id: authorAccountId,
        title,
        body,
        destination: destination || undefined,
      });
      setTitle("");
      setBody("");
      setDestination("");
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function runAction(id: string, action: OfficialOpsPublishAction) {
    setBusy(true);
    try {
      if (action === "submit") await postAdminOfficialGuideSubmitReview(id);
      if (action === "request") await postAdminOfficialGuideRequestPublish(id, {});
      if (action === "publish") await postAdminOfficialGuidePublish(id);
      await reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminDetailPageChrome
      titleId={titleId}
      title={t("admin_official_guides_title")}
      subtitle={t("admin_official_guides_subtitle")}
    >
      <AdminGuidesTriangleStrip current="official" />
      <AdminOpsPlanePermissionBanners read={ADMIN_PERM.OFFICIAL_READ} write={ADMIN_PERM.OFFICIAL_WRITE} publish={ADMIN_PERM.OFFICIAL_PUBLISH} />

      <AdminOpsRiskBanner messageKey="admin_ops_risk_banner_official_publish" variant="warning" />

      <OfficialOpsFormCard title={t("admin_official_guides_create_title")} onSubmit={(e) => void onCreate(e)} dataAttr="guides-create">
        <label className={`md:col-span-2 ${ADMIN_FILTER_FIELD_LABEL_CLASS}`}>
          {t("admin_official_guides_field_author")}
          <select
            className={`mt-1 ${ADMIN_FILTER_INPUT_MD_CLASS}`}
            value={authorAccountId}
            onChange={(e) => setAuthorAccountId(e.target.value)}
            required
          >
            <option value="">{t("admin_official_guides_field_author")}</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.display_label} ({acc.user_email ?? acc.id})
              </option>
            ))}
          </select>
        </label>
        <label className={`md:col-span-2 ${ADMIN_FILTER_FIELD_LABEL_CLASS}`}>
          {t("admin_official_guides_field_title")}
          <input className={`mt-1 ${ADMIN_FILTER_INPUT_MD_CLASS}`} value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label className={`md:col-span-1 ${ADMIN_FILTER_FIELD_LABEL_CLASS}`}>
          {t("admin_official_guides_field_destination")}
          <input className={`mt-1 ${ADMIN_FILTER_INPUT_MD_CLASS}`} value={destination} onChange={(e) => setDestination(e.target.value)} />
        </label>
        <label className={`md:col-span-2 ${ADMIN_FILTER_FIELD_LABEL_CLASS}`}>
          {t("admin_official_guides_field_body")}
          <textarea className={`mt-1 min-h-[120px] ${ADMIN_FILTER_INPUT_MD_CLASS}`} value={body} onChange={(e) => setBody(e.target.value)} rows={4} required />
        </label>
        <button type="submit" disabled={busy || !authorAccountId} className={`md:col-span-2 ${ADMIN_PRIMARY_ACTION_BTN_CLASS}`}>
          {t("admin_official_guides_action_create")}
        </button>
      </OfficialOpsFormCard>

      <OpsPlaneFetchStates loading={loading} error={error} onRetry={() => void reload()} loadingMessageKey="admin_official_loading" empty={!loading && !error && items.length === 0} emptyMessageKey="ops_plane_empty" skeleton>
        <OfficialOpsDataTable dataAttr="guides">
          <OfficialOpsTableHead>
            <tr>
              <OfficialOpsTableTh>{t("admin_official_guides_col_title")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_official_guides_col_author")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_official_guides_col_status")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_official_guides_col_post")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_official_col_actions")}</OfficialOpsTableTh>
            </tr>
          </OfficialOpsTableHead>
          <OfficialOpsTableBody>
            {items.map((row) => (
              <tr key={row.id}>
                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.title}</td>
                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.author_display_label ?? row.author_user_email ?? "—"}</td>
                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.publish_status}</td>
                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.community_post_id ?? "—"}</td>
                <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                  <OfficialOpsPublishRowActions
                    busy={busy}
                    publishLabelKey="admin_official_guides_action_publish"
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
