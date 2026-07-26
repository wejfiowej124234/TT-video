"use client";

import Link from "next/link";
import { useId, useMemo } from "react";

import { AdminSortableTh } from "@/components/admin/AdminSortableTh";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";

import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { AdminOpsLeafDataSourceStrip } from "@/components/admin/AdminOpsLeafDataSourceStrip";
import { AdminDisputeReadonlyAdjudicationDesk } from "@/components/admin/AdminDisputeReadonlyAdjudicationDesk";
import { AdminFinanceSectionBackLinks } from "@/components/admin/AdminFinanceSectionBackLinks";
import { AdminFinanceSuiteDepthNotice } from "@/components/admin/AdminFinanceSuiteDepthNotice";
import { AdminFinanceModuleDepthWorkspace } from "@/components/admin/AdminFinanceModuleDepthWorkspace";
import { AdminFinanceSuitePartialChecklist } from "@/components/admin/AdminFinanceSuitePartialChecklist";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
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
import { resolveDisputeAdjudicationDesk } from "@/lib/admin/disputeOpsL5";
import { shortAdminId } from "@/lib/admin/shortAdminId";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { useAdminDisputesPage } from "./useAdminDisputesPage";
import {
  ADMIN_FILTER_CARD_CLASS,
  ADMIN_FORM_FIELD_FOCUS_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_STATUS_NEUTRAL_BADGE_CLASS,
  ADMIN_TABLE_ROW_CLASS,
  ADMIN_TABLE_THEAD_CLASS,
  ADMIN_TABLE_TH_CELL_CLASS,
  ADMIN_TABLE_INLINE_LINK_CLASS,
  adminTableRowPrimaryActionClass,
  adminTableRowSecondaryActionClass,
  ADMIN_FILTER_RESET_BTN_CLASS,
  ADMIN_FILTER_INPUT_MD_CLASS,
  ADMIN_TABLE_SECTION_CLASS,
  ADMIN_LIST_REFRESHING_SURFACE_CLASS,
  ADMIN_TABLE_DIVIDE_CLASS,
  ADMIN_FILTER_ACTIONS_CLASS,
  ADMIN_FILTER_FIELD_LABEL_CLASS,
  ADMIN_FILTER_GRID_CLASS,
  ADMIN_FILTER_HINT_CLASS,
  ADMIN_FILTER_TITLE_CLASS,
  ADMIN_TEXT_SECONDARY_CLASS,
} from "@/lib/adminUi";

type DisputeSortKey = "status" | "created_at";

export function AdminDisputesPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const disputesLimitFieldId = useId();
  const disputesStatusFieldId = useId();
  const disputesIdFieldId = useId();
  const disputesOrderIdFieldId = useId();
  const disputesQFieldId = useId();
  const {
    loading,
    refreshing,
    error,
    items,
    orderId,
    appliedFilters,
    meta,
    draftLimit,
    setDraftLimit,
    draftStatus,
    setDraftStatus,
    draftDisputeId,
    setDraftDisputeId,
    draftOrderId,
    setDraftOrderId,
    draftQ,
    setDraftQ,
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
      <AdminOpsLeafDataSourceStrip leaf="disputes" meta={meta} />
      {orderId ? (
        <p
          className="mb-3 text-small text-ink-700"
          role="status"
          data-tt-admin-disputes-order-id-filter="1"
        >
          {t("admin_disputes_order_id_filter", { orderId })}
        </p>
      ) : null}
      <AdminPermissionDeniedBanner
        permission={ADMIN_PERM.ORDERS_READ}
        messageKey="admin_perm_denied_orders_read"
      />
      <p
        className={`mb-3 text-meta ${ADMIN_TEXT_SECONDARY_CLASS}`}
        data-tt-admin-disputes-readonly-badge="1"
        role="note"
      >
        {t("admin_disputes_ledger_readonly_note")}
      </p>

      <AdminDisputeReadonlyAdjudicationDesk
        disputeId={null}
        orderId={orderId || null}
        variant="list"
        defaultCollapsed
      />

      {/* FD10 · 财务观测默认折叠，首屏=筛选+表 */}
      <details
        className={`mb-4 ${ADMIN_FILTER_CARD_CLASS}`}
        data-tt-admin-disputes-finance-obs-fold="1"
      >
        <summary className="cursor-pointer text-body font-medium text-ink-800">
          {t("admin_disputes_finance_obs_fold")}
        </summary>
        <div className="mt-3 space-y-3">
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
        </div>
      </details>

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
            <label htmlFor={disputesQFieldId} className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
              {t("admin_disputes_q_label")}
              <input
                id={disputesQFieldId}
                className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_MD_CLASS} px-3 py-2 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                type="search"
                value={draftQ}
                onChange={(e) => setDraftQ(e.target.value)}
                placeholder={t("admin_disputes_q_placeholder")}
                data-tt-admin-disputes-q="1"
              />
            </label>
            <label htmlFor={disputesIdFieldId} className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
              {t("admin_disputes_id_label")}
              <input
                id={disputesIdFieldId}
                className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_MD_CLASS} px-3 py-2 font-mono ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                type="text"
                value={draftDisputeId}
                onChange={(e) => setDraftDisputeId(e.target.value)}
                data-tt-admin-disputes-id="1"
              />
            </label>
            <label htmlFor={disputesOrderIdFieldId} className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
              {t("admin_disputes_order_id_label")}
              <input
                id={disputesOrderIdFieldId}
                className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_MD_CLASS} px-3 py-2 font-mono ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                type="text"
                value={draftOrderId}
                onChange={(e) => setDraftOrderId(e.target.value)}
                data-tt-admin-disputes-order-id="1"
              />
            </label>
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
        <AdminListLoadingStatus
          message={t("admin_disputes_loading")}
          hint={t("admin_disputes_loading_hint")}
        />
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

      {!loading && !error && items.length === 0 ? (
        <AdminListPageEmptyState
          messageKey="admin_list_empty_disputes"
          hintKey="admin_list_empty_disputes_hint"
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
              {sortedItems.map((d) => {
                const desk = resolveDisputeAdjudicationDesk({
                  disputeId: d.id,
                  orderId: d.order_id,
                  status: d.status,
                });
                return (
                  <tr key={d.id} className={ADMIN_TABLE_ROW_CLASS}>
                    <td className="px-4 py-3">
                      <p className="font-mono text-small font-medium text-ink-900" title={d.id}>
                        {shortAdminId(d.id) || t("admin_em_dash")}
                      </p>
                      <p className={`mt-0.5 text-meta ${ADMIN_TEXT_SECONDARY_CLASS}`} title={d.order_id}>
                        {t("admin_disputes_colOrderId")}:{" "}
                        {desk.orderAdminHref ? (
                          <Link
                            href={desk.orderAdminHref}
                            className={ADMIN_TABLE_INLINE_LINK_CLASS}
                            data-tt-admin-disputes-order-link="1"
                          >
                            {shortAdminId(d.order_id) || t("admin_em_dash")}
                          </Link>
                        ) : (
                          shortAdminId(d.order_id) || t("admin_em_dash")
                        )}
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
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/disputes/${encodeURIComponent(d.id)}`}
                          className={adminTableRowPrimaryActionClass()}
                          aria-label={t("admin_disputes_open_row_aria", { id: d.id })}
                          data-tt-admin-disputes-view="1"
                        >
                          {t("admin_disputes_opsOpen")}
                        </Link>
                        {desk.publicHref ? (
                          <Link
                            href={desk.publicHref}
                            className={adminTableRowSecondaryActionClass()}
                            data-tt-admin-disputes-public-arb="1"
                          >
                            {t("admin_dispute_adjudication_open_public")}
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ) : null}
    </AdminListPageChrome>
  );
}
