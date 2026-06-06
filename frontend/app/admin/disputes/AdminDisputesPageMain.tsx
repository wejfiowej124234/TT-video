"use client";

import Link from "next/link";
import { useId, useMemo } from "react";

import { AdminSortableTh } from "@/components/admin/AdminSortableTh";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";

import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { AdminFinanceSectionBackLinks } from "@/components/admin/AdminFinanceSectionBackLinks";
import { AdminFinanceSuiteDepthNotice } from "@/components/admin/AdminFinanceSuiteDepthNotice";
import { AdminFinanceModuleDepthWorkspace } from "@/components/admin/AdminFinanceModuleDepthWorkspace";
import { AdminFinanceSuitePartialChecklist } from "@/components/admin/AdminFinanceSuitePartialChecklist";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { useTranslation } from "@/components/LocaleProvider";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { DISPUTES_LIST_RELATED_FOLD_LINKS } from "@/lib/admin/adminFinanceRelatedFoldLinks";
import { ADMIN_EMPTY_NEXT_DISPUTES_FILTERED_EMPTY } from "@/lib/admin/adminListEmptyStateNextLinks";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import {
  DISPUTE_STATUS_FILTER_OPTIONS,
  disputeStatusLabelKey,
  formatDisputesAppliedFiltersHuman,
} from "@/lib/admin/adminDisputesLabels";
import { shortAdminId } from "@/lib/admin/shortAdminId";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { ADMIN_FILTER_CARD_CLASS, ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_LINK_FOCUS_CLASS, ADMIN_PRIMARY_ACTION_BTN_CLASS, ADMIN_STATUS_NEUTRAL_BADGE_CLASS, ADMIN_TABLE_ROW_CLASS, ADMIN_TABLE_THEAD_CLASS, ADMIN_TABLE_TH_CELL_CLASS, adminTableRowPrimaryActionClass,
  ADMIN_FILTER_RESET_BTN_CLASS,
  ADMIN_FILTER_INPUT_MD_CLASS,
  ADMIN_TABLE_SECTION_CLASS,
  ADMIN_LIST_REFRESHING_SURFACE_CLASS,
  ADMIN_TABLE_DIVIDE_CLASS,
  ADMIN_FILTER_ACTIONS_CLASS,
  ADMIN_FILTER_FIELD_LABEL_CLASS,
  ADMIN_FILTER_GRID_CLASS,
  ADMIN_FILTER_HINT_CLASS,
  ADMIN_FILTER_TITLE_CLASS} from "@/lib/adminUi";

type DisputeSortKey = "status" | "created_at";

export function AdminDisputesPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const disputesLimitFieldId = useId();
  const disputesStatusFieldId = useId();
  const {
    loading,
    refreshing,
    error,
    items,
    appliedFilters,
    meta,
    draftLimit,
    setDraftLimit,
    draftStatus,
    setDraftStatus,
    apply,
    reset,
  } = useAdminDisputesPage();

  const { sort, toggle, ariaSort } = useAdminTableSort<DisputeSortKey>("created_at", "desc");
  const sortedItems = useMemo(
    () =>
      sortRowsByKey(items, sort.key, sort.dir, (d, key) => {
        if (key === "created_at") return d.created_at ?? "";
        return d.status ?? "";
      }),
    [items, sort.key, sort.dir],
  );

  const appliedHuman = formatDisputesAppliedFiltersHuman(appliedFilters, t);

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_disputes_title")}
      subtitle={t("admin_disputes_subtitle_l5")}
      headerAside={<AdminFinanceSectionBackLinks />}
    >
      <AdminOpsDetailRelatedFold
        relatedLinks={DISPUTES_LIST_RELATED_FOLD_LINKS}
        ariaLabelKey="admin_finance_related_aria"
        foldSummaryKey="admin_finance_related_fold"
        dataTtFold="disputes-list"
      />
      <AdminPermissionDeniedBanner
        permission={ADMIN_PERM.ORDERS_READ}
        messageKey="admin_perm_denied_orders_read"
      />
      <AdminFinanceSuiteDepthNotice />
      <AdminFinanceSuitePartialChecklist />
      <AdminFinanceModuleDepthWorkspace
        refunds={{
          items: items.map((d) => ({
            id: d.id,
            status: d.status,
            order_id: d.order_id,
          })),
          loading,
          error: Boolean(error),
        }}
      />

      <div className={`mt-5 ${ADMIN_FILTER_CARD_CLASS}`}>
        <form
          id="admin-disputes-filter-form"
          aria-label={t("admin_disputes_filters_aria")}
          aria-describedby={
            [adminListApplyResetHintId, !loading && !error && appliedHuman ? adminAppliedFiltersDescId : ""]
              .filter(Boolean)
              .join(" ")
          }
          onSubmit={apply}
        >
          <h2 className={ADMIN_FILTER_TITLE_CLASS}>{t("admin_disputes_filters_title")}</h2>
          <p id={adminListApplyResetHintId} className={ADMIN_FILTER_HINT_CLASS}>
            {t("admin_list_filters_apply_reset_hint")}
          </p>
          <div className={ADMIN_FILTER_GRID_CLASS}>
            <label htmlFor={disputesLimitFieldId} className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
              {t("admin_disputes_limit_label")}
              <input
                id={disputesLimitFieldId}
                className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_MD_CLASS} px-3 py-2 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                type="number"
                min={1}
                max={500}
                value={draftLimit}
                onChange={(e) => setDraftLimit(e.target.value)}
              />
            </label>
            <label htmlFor={disputesStatusFieldId} className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
              {t("admin_disputes_status_filter_label")}
              <select
                id={disputesStatusFieldId}
                className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_MD_CLASS} px-3 py-2 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                value={draftStatus}
                onChange={(e) => setDraftStatus(e.target.value)}
              >
                <option value="">{t("admin_disputes_status_all")}</option>
                {DISPUTE_STATUS_FILTER_OPTIONS.filter(Boolean).map((s) => (
                  <option key={s} value={s}>
                    {t(disputeStatusLabelKey(s))}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </form>
        <div className={ADMIN_FILTER_ACTIONS_CLASS}>
          <button form="admin-disputes-filter-form" className={ADMIN_PRIMARY_ACTION_BTN_CLASS} type="submit">
            {t("admin_disputes_apply")}
          </button>
          <form
            className="inline"
            aria-describedby={adminListApplyResetHintId}
            onSubmit={(e) => {
              e.preventDefault();
              reset();
            }}
          >
            <button
              className={`inline-flex min-h-[44px] items-center justify-center ${ADMIN_FILTER_RESET_BTN_CLASS} ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              type="submit"
            >
              {t("admin_disputes_reset")}
            </button>
          </form>
        </div>
      </div>

      {loading ? (
        <AdminListLoadingStatus message={t("admin_loading")} />
      ) : null}

      {error ? (
        <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
      ) : null}

      {!loading && !error && appliedHuman ? (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="card" className="mt-6">
          {t("admin_disputes_applied")}
          {appliedHuman}
        </AdminAppliedFiltersBanner>
      ) : null}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {!loading && !error && items.length === 0 ? (
        <AdminListPageEmptyState
          messageKey="admin_list_empty_disputes"
          nextLinks={ADMIN_EMPTY_NEXT_DISPUTES_FILTERED_EMPTY}
          filteredEmpty={Boolean(appliedHuman)}
        />
      ) : null}

      {!loading && items.length > 0 ? (
        <section
          className={`${ADMIN_TABLE_SECTION_CLASS}${refreshing ? ` ${ADMIN_LIST_REFRESHING_SURFACE_CLASS}` : ""}`}
          aria-label={t("admin_disputes_table_aria")}
          data-tt-admin-list-refreshing={refreshing ? "1" : undefined}
        >
          <table className={`min-w-full ${ADMIN_TABLE_DIVIDE_CLASS} text-left text-small`}>
            <thead className={ADMIN_TABLE_THEAD_CLASS}>
              <tr>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_disputes_colSummary")}
                </th>
                <AdminSortableTh
                  label={t("admin_disputes_colStatus")}
                  ariaSort={ariaSort("status")}
                  onToggle={() => toggle("status")}
                />
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_disputes_colResolution")}
                </th>
                <AdminSortableTh
                  label={t("admin_disputes_colCreated")}
                  ariaSort={ariaSort("created_at")}
                  onToggle={() => toggle("created_at")}
                />
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_disputes_colOps")}
                </th>
              </tr>
            </thead>
            <tbody className={`${ADMIN_TABLE_DIVIDE_CLASS} text-ink-700`}>
              {sortedItems.map((d) => (
                <tr key={d.id} className={ADMIN_TABLE_ROW_CLASS}>
                  <td className="px-4 py-3">
                    <p className="font-mono text-small text-ink-800 font-medium text-ink-900" title={d.id}>
                      {shortAdminId(d.id) || t("admin_em_dash")}
                    </p>
                    <p className="mt-0.5 text-meta text-ink-500" title={d.order_id}>
                      {t("admin_disputes_colOrderId")}: {shortAdminId(d.order_id) || t("admin_em_dash")}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={ADMIN_STATUS_NEUTRAL_BADGE_CLASS}>
                      {t(disputeStatusLabelKey(d.status))}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-meta">
                    {d.refund_ratio != null || d.slash_guide != null
                      ? t("admin_disputes_resolution_short", {
                          refund: String(d.refund_ratio ?? "—"),
                          slash: String(d.slash_guide ?? "—"),
                        })
                      : t("admin_em_dash")}
                  </td>
                  <td className="px-4 py-3 text-meta whitespace-nowrap">
                    {d.created_at ? new Date(d.created_at).toLocaleString() : t("admin_em_dash")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/disputes/${encodeURIComponent(d.id)}`}
                      className={adminTableRowPrimaryActionClass()}
                      aria-label={t("admin_disputes_open_row_aria", { id: d.id })}
                    >
                      {t("admin_disputes_opsOpen")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </AdminListPageChrome>
  );
}
