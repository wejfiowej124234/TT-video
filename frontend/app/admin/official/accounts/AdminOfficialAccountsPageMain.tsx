"use client";

import Link from "next/link";
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

import { AdminOpsRiskBanner } from "@/components/admin/ops/AdminOpsRiskBanner";
import { OfficialOpsPublishRowActions, type OfficialOpsPublishAction } from "@/components/admin/ops/OfficialOpsPublishRowActions";
import { OpsPlaneFetchStates } from "@/components/admin/ops/OpsPlaneFetchStates";
import {
  ADMIN_FILTER_FIELD_LABEL_CLASS,
  ADMIN_FILTER_INPUT_MD_CLASS,
  ADMIN_FILTER_INPUT_SM_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_TABLE_TD_CELL_CLASS,
  ADMIN_TEXT_FOOTNOTE_CLASS,
  adminPageNavLinkClass,
  adminTableRowPrimaryActionClass,
  adminTableRowSecondaryActionClass,
} from "@/lib/adminUi";
import {
  isOfficialAccountProbeRow,
  officialAccountKindLabelKey,
  officialAccountPublishShowFlags,
  officialAccountReviewLabelKey,
  officialAccountVerifyHref,
} from "@/lib/admin/officialOpsL5";
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

function truncateEmail(email: string | null | undefined, max = 28): string {
  if (!email) return "—";
  if (email.length <= max) return email;
  return `${email.slice(0, max - 1)}…`;
}

export function AdminOfficialAccountsPageMain() {
  const { t } = useTranslation();
  const titleId = useId();
  const { items, loading, error, reload } = useAdminOfficialAccountsPage();
  const listFailed = Boolean(error);
  const writesDisabled = listFailed || loading;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountKind, setAccountKind] = useState("traveler");
  const [displayLabel, setDisplayLabel] = useState("");
  const [bindLabel, setBindLabel] = useState("KOL");
  const [busy, setBusy] = useState(false);
  const [showProbes, setShowProbes] = useState(false);

  const visibleItems = useMemo(
    () => (showProbes ? items : items.filter((row) => !isOfficialAccountProbeRow(row))),
    [items, showProbes],
  );

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

  async function runAction(id: string, action: OfficialOpsPublishAction | "bind") {
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
        onSubmit={(e) => {
          if (writesDisabled || busy) {
            e.preventDefault();
            return;
          }
          void onCreate(e);
        }}
        dataAttr="accounts-create"
        data-tt-admin-official-writes-disabled={writesDisabled ? "1" : "0"}
      >
        {writesDisabled && listFailed ? (
          <p className="md:col-span-2 text-small text-ink-500" data-tt-admin-official-create-blocked="1" role="note">
            {t("admin_ops_create_blocked_list_failed")}
          </p>
        ) : null}
        <label className={`md:col-span-1 ${ADMIN_FILTER_FIELD_LABEL_CLASS}`}>
          {t("admin_official_field_email")}
          <input
            className={`mt-1 ${ADMIN_FILTER_INPUT_MD_CLASS}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={writesDisabled || busy}
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
            disabled={writesDisabled || busy}
          />
        </label>
        <label className={`md:col-span-1 ${ADMIN_FILTER_FIELD_LABEL_CLASS}`}>
          {t("admin_official_col_kind")}
          <select
            className={`mt-1 ${ADMIN_FILTER_INPUT_MD_CLASS}`}
            value={accountKind}
            onChange={(e) => setAccountKind(e.target.value)}
            disabled={writesDisabled || busy}
            data-tt-admin-official-kind-select="1"
          >
            <option value="traveler">{t("admin_official_kind_traveler")}</option>
            <option value="guide">{t("admin_official_kind_guide")}</option>
            <option value="merchant">{t("admin_official_kind_merchant")}</option>
            <option value="community_author">{t("admin_official_kind_community_author")}</option>
          </select>
        </label>
        <label className={`md:col-span-1 ${ADMIN_FILTER_FIELD_LABEL_CLASS}`}>
          {t("admin_official_field_display_label")}
          <input
            className={`mt-1 ${ADMIN_FILTER_INPUT_MD_CLASS}`}
            value={displayLabel}
            onChange={(e) => setDisplayLabel(e.target.value)}
            required
            disabled={writesDisabled || busy}
          />
        </label>
        <button
          type="submit"
          disabled={writesDisabled || busy}
          className={`md:col-span-2 ${ADMIN_PRIMARY_ACTION_BTN_CLASS}`}
          data-tt-admin-official-create-submit="1"
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
          <label
            className={`ml-auto flex items-center gap-2 text-small ${ADMIN_TEXT_FOOTNOTE_CLASS}`}
            data-tt-admin-official-show-probes="1"
          >
            <input
              type="checkbox"
              checked={showProbes}
              onChange={(e) => setShowProbes(e.target.checked)}
            />
            {t("admin_official_show_probes")}
          </label>
        </div>
      </section>

      <OpsPlaneFetchStates
        loading={loading}
        error={error}
        onRetry={() => void reload()}
        loadingMessageKey="admin_official_loading"
        empty={!loading && !error && visibleItems.length === 0}
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
            {visibleItems.map((row) => {
              const status = reviewStatus(row);
              const probe = isOfficialAccountProbeRow(row);
              const verifyHref =
                status === "published" ? officialAccountVerifyHref(row) : null;
              const showFlags = officialAccountPublishShowFlags(status);
              return (
                <tr key={row.id} data-tt-admin-official-probe={probe ? "1" : "0"}>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                    <span className="font-medium">{row.display_label}</span>
                    {probe ? (
                      <span className="ml-2 rounded border border-warning/40 px-1.5 py-0.5 text-meta text-warning">
                        {t("admin_official_probe_badge")}
                      </span>
                    ) : null}
                  </td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                    {t(officialAccountKindLabelKey(row.account_kind))}
                  </td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                    <span title={row.user_email ?? undefined} className="tabular-nums">
                      {truncateEmail(row.user_email)}
                    </span>
                  </td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                    <span data-tt-admin-official-review={status}>
                      {t(officialAccountReviewLabelKey(status))}
                    </span>
                  </td>
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
                      show={showFlags}
                      onAction={(action) => void runAction(row.id, action)}
                    />
                    {!row.kol_referral_code && status !== "archived" ? (
                      <button
                        type="button"
                        className={`${adminTableRowSecondaryActionClass()} ml-2`}
                        disabled={busy}
                        onClick={() => void runAction(row.id, "bind")}
                      >
                        {t("admin_official_action_bind_kol")}
                      </button>
                    ) : null}
                    {status === "published" ? (
                      verifyHref ? (
                        <Link
                          href={verifyHref}
                          className={`${adminTableRowPrimaryActionClass()} ml-2 inline-flex`}
                          data-tt-admin-official-verify-cta="1"
                          target={verifyHref.startsWith("/admin") ? undefined : "_blank"}
                          rel={verifyHref.startsWith("/admin") ? undefined : "noreferrer"}
                        >
                          {t("admin_official_action_verify")}
                        </Link>
                      ) : (
                        <span
                          className={`ml-2 text-meta ${ADMIN_TEXT_FOOTNOTE_CLASS}`}
                          data-tt-admin-official-verify-unavailable="1"
                        >
                          {t("admin_official_action_verify_unavailable")}
                        </span>
                      )
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </OfficialOpsTableBody>
        </OfficialOpsDataTable>
      </OpsPlaneFetchStates>
    </AdminDetailPageChrome>
  );
}
