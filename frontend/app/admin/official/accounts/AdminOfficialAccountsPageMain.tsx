"use client";

import Link from "next/link";
import { useId, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import {
  OfficialOpsDataTable,
  OfficialOpsTableBody,
  OfficialOpsTableHead,
  OfficialOpsTableTh,
} from "@/components/admin/ops/OfficialOpsDataTable";
import { OfficialOpsFormCard } from "@/components/admin/ops/OfficialOpsFormCard";

import { AdminOpsRiskBanner } from "@/components/admin/ops/AdminOpsRiskBanner";
import { OfficialOpsPublishRowActions } from "@/components/admin/ops/OfficialOpsPublishRowActions";
import { OpsPlaneFetchStates } from "@/components/admin/ops/OpsPlaneFetchStates";
import {
  ADMIN_FILTER_FIELD_LABEL_CLASS,
  ADMIN_FILTER_INPUT_MD_CLASS,
  ADMIN_FILTER_INPUT_SM_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_TABLE_TD_CELL_CLASS,
  adminPageNavLinkClass,
  adminTableRowSecondaryActionClass,
} from "@/lib/adminUi";
import {
  postAdminOfficialAccount,
  postAdminOfficialAccountBindReferral,
  postAdminOfficialAccountPublish,
  postAdminOfficialAccountRequestPublish,
  postAdminOfficialAccountSubmitReview,
  type AdminOfficialAccountRow,
} from "@/lib/apiClient";

import { useAdminOfficialAccountsPage } from "./useAdminOfficialAccountsPage";

function reviewStatus(row: AdminOfficialAccountRow) {
  const meta = row.metadata ?? {};
  return typeof meta.review_status === "string" ? meta.review_status : "draft";
}

export function AdminOfficialAccountsPageMain() {
  const { t } = useTranslation();
  const titleId = useId();
  const { items, loading, error, reload } = useAdminOfficialAccountsPage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountKind, setAccountKind] = useState("traveler");
  const [displayLabel, setDisplayLabel] = useState("");
  const [bindLabel, setBindLabel] = useState("KOL");
  const [busy, setBusy] = useState(false);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await postAdminOfficialAccount({
        email,
        password,
        account_kind: accountKind,
        display_label: displayLabel,
      });
      setEmail("");
      setPassword("");
      setDisplayLabel("");
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function runAction(id: string, action: "submit" | "request" | "publish" | "bind") {
    setBusy(true);
    try {
      if (action === "submit") await postAdminOfficialAccountSubmitReview(id);
      if (action === "request") await postAdminOfficialAccountRequestPublish(id, {});
      if (action === "publish") await postAdminOfficialAccountPublish(id);
      if (action === "bind") {
        await postAdminOfficialAccountBindReferral(id, { label: bindLabel.trim() || "KOL" });
      }
      await reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminDetailPageChrome
      titleId={titleId}
      title={t("admin_official_accounts_title")}
      subtitle={t("admin_official_accounts_subtitle")}
    >
      <AdminOpsPlanePermissionBanners read={ADMIN_PERM.OFFICIAL_READ} write={ADMIN_PERM.OFFICIAL_WRITE} publish={ADMIN_PERM.OFFICIAL_PUBLISH} />

      <AdminOpsRiskBanner messageKey="admin_ops_risk_banner_official_publish" variant="warning" />

      <OfficialOpsFormCard
        title={t("admin_official_accounts_create_title")}
        onSubmit={(e) => void onCreate(e)}
        dataAttr="accounts-create"
      >
        <label className={`md:col-span-1 ${ADMIN_FILTER_FIELD_LABEL_CLASS}`}>
          {t("admin_official_field_email")}
          <input
            className={`mt-1 ${ADMIN_FILTER_INPUT_MD_CLASS}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className={`md:col-span-1 ${ADMIN_FILTER_FIELD_LABEL_CLASS}`}>
          {t("admin_official_field_password")}
          <input
            type="password"
            className={`mt-1 ${ADMIN_FILTER_INPUT_MD_CLASS}`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <label className={`md:col-span-1 ${ADMIN_FILTER_FIELD_LABEL_CLASS}`}>
          {t("admin_official_col_kind")}
          <select
            className={`mt-1 ${ADMIN_FILTER_INPUT_MD_CLASS}`}
            value={accountKind}
            onChange={(e) => setAccountKind(e.target.value)}
          >
            <option value="traveler">traveler</option>
            <option value="guide">guide</option>
            <option value="merchant">merchant</option>
            <option value="community_author">community_author</option>
          </select>
        </label>
        <label className={`md:col-span-1 ${ADMIN_FILTER_FIELD_LABEL_CLASS}`}>
          {t("admin_official_field_display_label")}
          <input
            className={`mt-1 ${ADMIN_FILTER_INPUT_MD_CLASS}`}
            value={displayLabel}
            onChange={(e) => setDisplayLabel(e.target.value)}
            required
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className={`md:col-span-2 ${ADMIN_PRIMARY_ACTION_BTN_CLASS}`}
        >
          {t("admin_official_action_create")}
        </button>
      </OfficialOpsFormCard>

      <section className="mb-4 rounded-lg border border-ref-sun/16 bg-bg-console/60 px-4 py-3">
        <p className="text-small text-ink-600">{t("admin_official_accounts_bind_hint")}</p>
        <div className="mt-2 flex flex-wrap items-end gap-3">
          <label className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
            {t("admin_official_accounts_bind_label_field")}
            <input
              className={`mt-1 w-40 ${ADMIN_FILTER_INPUT_SM_CLASS}`}
              value={bindLabel}
              onChange={(e) => setBindLabel(e.target.value)}
            />
          </label>
          <Link href="/admin/growth/referral-codes" className={adminPageNavLinkClass()}>
            {t("admin_ops_crossnav_referral_codes")}
          </Link>
        </div>
      </section>

      <OpsPlaneFetchStates
        loading={loading}
        error={error}
        onRetry={() => void reload()}
        loadingMessageKey="admin_official_loading"
        empty={!loading && !error && items.length === 0}
        emptyMessageKey="ops_plane_empty"
        skeleton
      >
        <OfficialOpsDataTable dataAttr="accounts">
          <OfficialOpsTableHead>
            <tr>
              <OfficialOpsTableTh>{t("admin_official_col_label")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_official_col_kind")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_official_col_email")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_official_col_review")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_official_col_kol")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_official_col_actions")}</OfficialOpsTableTh>
            </tr>
          </OfficialOpsTableHead>
          <OfficialOpsTableBody>
            {items.map((row) => (
              <tr key={row.id}>
                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.display_label}</td>
                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.account_kind}</td>
                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.user_email ?? "—"}</td>
                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{reviewStatus(row)}</td>
                <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                  {row.kol_referral_code ? (
                    row.kol_referral_code
                  ) : (
                    <Link href="/admin/growth/referral-codes" className={adminPageNavLinkClass()}>
                      {t("admin_official_accounts_create_referral_link")}
                    </Link>
                  )}
                </td>
                <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                  <OfficialOpsPublishRowActions
                    busy={busy}
                    onAction={(action) => void runAction(row.id, action)}
                  />
                  {!row.kol_referral_code ? (
                    <button
                      type="button"
                      className={`${adminTableRowSecondaryActionClass()} ml-2`}
                      disabled={busy}
                      onClick={() => void runAction(row.id, "bind")}
                    >
                      {t("admin_official_action_bind_kol")}
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </OfficialOpsTableBody>
        </OfficialOpsDataTable>
      </OpsPlaneFetchStates>
    </AdminDetailPageChrome>
  );
}
