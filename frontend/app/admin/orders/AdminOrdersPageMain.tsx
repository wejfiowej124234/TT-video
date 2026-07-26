"use client";

import Link from "next/link";
import { useId, useMemo } from "react";

import { AdminSortableTh } from "@/components/admin/AdminSortableTh";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";

import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { AdminOpsLeafDataSourceStrip } from "@/components/admin/AdminOpsLeafDataSourceStrip";
import { AdminOrdersOpsJumpPack } from "@/components/admin/AdminOrdersOpsJumpPack";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { useTranslation } from "@/components/LocaleProvider";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import { ADMIN_EMPTY_NEXT_ORDERS_FILTERED_EMPTY } from "@/lib/admin/adminListEmptyStateNextLinks";
import {
  formatOrdersAppliedFiltersHuman,
  ORDER_STATE_FILTER_OPTIONS,
  orderStateLabelKey,
} from "@/lib/admin/adminOrdersLabels";
import { formatAdminMoney } from "@/lib/admin/formatAdminMoney";
import { shortAdminId } from "@/lib/admin/shortAdminId";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { shortEvmAddress } from "@/lib/formatEvmAddress";
import { stashEscrowOrderPrefetchFromAdminOrderListRow } from "@/lib/orderEscrowPrefetch";
import { ORDERS_LIST_RELATED_FOLD_LINKS } from "@/lib/admin/adminOpsListRelatedFoldLinks";
import { useAdminOrdersPage } from "./useAdminOrdersPage";
import {
  ADMIN_FILTER_CARD_CLASS,
  ADMIN_FILTER_ACTIONS_CLASS,
  ADMIN_FILTER_FIELD_LABEL_CLASS,
  ADMIN_FILTER_GRID_CLASS,
  ADMIN_FILTER_HINT_CLASS,
  ADMIN_FILTER_TITLE_CLASS,
  ADMIN_FORM_FIELD_FOCUS_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_STATUS_NEUTRAL_BADGE_CLASS,
  ADMIN_TABLE_ROW_ACTIONS_CLASS,
  ADMIN_TABLE_ROW_CLASS,
  ADMIN_TABLE_THEAD_CLASS,
  ADMIN_TABLE_TH_CELL_CLASS,
  adminPageNavLinkClass,
  adminTableRowPrimaryActionClass,
  adminTableRowSecondaryActionClass,
  ADMIN_FILTER_RESET_BTN_CLASS,
  ADMIN_FILTER_INPUT_MD_CLASS,
  ADMIN_TABLE_SECTION_CLASS,
  ADMIN_LIST_REFRESHING_SURFACE_CLASS,
  ADMIN_TABLE_DIVIDE_CLASS,
  ADMIN_TABLE_TD_MONO_CLASS,
  ADMIN_TABLE_TD_TIMESTAMP_CLASS,
  ADMIN_TEXT_META_CLASS,
  ADMIN_TEXT_MUTED_CLASS,
  ADMIN_TEXT_SECONDARY_CLASS,
} from "@/lib/adminUi";

type OrderSortKey = "state" | "amount" | "created_at";

function orderStateBadgeClass(state: string): string {
  const s = state.trim().toLowerCase();
  if (s === "disputed") {
    return "inline-flex rounded-full border border-ref-sun/50 bg-ref-sun/10 px-2 py-0.5 text-meta font-medium text-ref-sun";
  }
  if (s === "completed") {
    return "inline-flex rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-meta font-medium text-emerald-300";
  }
  return ADMIN_STATUS_NEUTRAL_BADGE_CLASS;
}

export function AdminOrdersPageMain() {
  const { t } = useTranslation();
  const caps = useAdminCapabilities();
  const pageTitleId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const ordersLimitFieldId = useId();
  const ordersStateFieldId = useId();
  const ordersIdFieldId = useId();
  const {
    loading,
    refreshing,
    error,
    items,
    appliedFilters,
    meta,
    draftLimit,
    setDraftLimit,
    draftState,
    setDraftState,
    draftIdQuery,
    setDraftIdQuery,
    apply,
    reset,
  } = useAdminOrdersPage();

  const canUsersRead =
    caps.permissionsLoaded && caps.hasPermission(ADMIN_PERM.USERS_READ);

  const { sort, toggle, ariaSort } = useAdminTableSort<OrderSortKey>("created_at", "desc");
  const sortedItems = useMemo(
    () =>
      sortRowsByKey(items, sort.key, sort.dir, (o, key) => {
        if (key === "amount") return Number(o.amount) || 0;
        if (key === "created_at") return o.created_at ?? "";
        return o.state ?? "";
      }),
    [items, sort.key, sort.dir],
  );

  const appliedHuman = formatOrdersAppliedFiltersHuman(appliedFilters, t);

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_orders_title")}
      subtitle={
        <>
          <p>{t("admin_orders_subtitle_l5")}</p>
          <p
            className={`mt-1 text-small ${ADMIN_TEXT_SECONDARY_CLASS}`}
            data-tt-admin-orders-readonly-footnote="1"
            role="note"
          >
            {t("admin_orders_readonly_escrow_footnote")}
          </p>
        </>
      }
      mainDataAttrs={{
        "data-tt-admin-orders-page": "1",
        "data-tt-admin-orders-force-readonly-badge": "1",
      }}
    >
      <AdminOpsDetailRelatedFold
        relatedLinks={ORDERS_LIST_RELATED_FOLD_LINKS}
        ariaLabelKey="admin_ops_list_related_aria"
        foldSummaryKey="admin_ops_list_related_fold"
        dataTtFold="orders-list"
      />
      {/* Batch-13 FO10 · JumpPack 默认折叠，首屏让位筛选+表 */}
      <details
        className="mb-4"
        data-tt-admin-orders-ops-jump-fold="1"
        data-tt-admin-orders-ops-jump-default-closed="1"
      >
        <summary
          className={`cursor-pointer list-none text-small font-medium ${ADMIN_TEXT_META_CLASS} marker:content-none [&::-webkit-details-marker]:hidden`}
        >
          {t("admin_orders_ops_pack_fold_summary")}
        </summary>
        <div className="mt-2">
          <AdminOrdersOpsJumpPack variant="list" />
        </div>
      </details>
      <AdminOpsLeafDataSourceStrip leaf="orders" meta={meta} />
      <AdminPermissionDeniedBanner
        permission={ADMIN_PERM.ORDERS_READ}
        messageKey="admin_perm_denied_orders_read"
      />
      <div className={`mt-5 ${ADMIN_FILTER_CARD_CLASS}`}>
        <form
          id="admin-orders-filter-form"
          aria-label={t("admin_orders_filters_aria")}
          aria-describedby={
            [adminListApplyResetHintId, !loading && !error && appliedHuman ? adminAppliedFiltersDescId : ""]
              .filter(Boolean)
              .join(" ")
          }
          onSubmit={apply}
        >
          <h2 className={ADMIN_FILTER_TITLE_CLASS}>{t("admin_orders_filters_title")}</h2>
          <p id={adminListApplyResetHintId} className={ADMIN_FILTER_HINT_CLASS}>
            {t("admin_list_filters_apply_reset_hint")}
          </p>
          <div className={ADMIN_FILTER_GRID_CLASS}>
            <label htmlFor={ordersIdFieldId} className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
              {t("admin_orders_id_label")}
              <input
                id={ordersIdFieldId}
                name="q"
                data-tt-admin-orders-id-input="1"
                data-tt-admin-orders-q="1"
                className={`mt-1 block w-full min-h-[44px] ${ADMIN_FILTER_INPUT_MD_CLASS} px-3 py-2 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                type="search"
                autoComplete="off"
                placeholder={t("admin_orders_id_placeholder")}
                value={draftIdQuery}
                onChange={(e) => setDraftIdQuery(e.target.value)}
              />
            </label>
            <label htmlFor={ordersLimitFieldId} className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
              {t("admin_orders_limit_label")}
              <input
                id={ordersLimitFieldId}
                name="limit"
                className={`mt-1 block w-full min-h-[44px] max-w-[8rem] ${ADMIN_FILTER_INPUT_MD_CLASS} px-3 py-2 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                type="number"
                min={1}
                max={500}
                value={draftLimit}
                onChange={(e) => setDraftLimit(e.target.value)}
              />
            </label>
            <label htmlFor={ordersStateFieldId} className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
              {t("admin_orders_state_label")}
              <select
                id={ordersStateFieldId}
                name="state"
                data-tt-admin-orders-state-select="1"
                className={`mt-1 block w-full min-h-[44px] ${ADMIN_FILTER_INPUT_MD_CLASS} px-3 py-2 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                value={draftState}
                onChange={(e) => setDraftState(e.target.value)}
              >
                <option value="">{t("admin_orders_state_all")}</option>
                {ORDER_STATE_FILTER_OPTIONS.filter(Boolean).map((s) => (
                  <option key={s} value={s}>
                    {t(orderStateLabelKey(s))}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </form>
        <div className={ADMIN_FILTER_ACTIONS_CLASS}>
          <button form="admin-orders-filter-form" className={ADMIN_PRIMARY_ACTION_BTN_CLASS} type="submit">
            {t("admin_orders_apply")}
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
              {t("admin_orders_reset")}
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
          {t("admin_orders_applied")}
          {appliedHuman}
        </AdminAppliedFiltersBanner>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <AdminListPageEmptyState
          messageKey={
            appliedHuman ? "admin_orders_empty_filtered" : "admin_list_empty_orders"
          }
          nextLinks={ADMIN_EMPTY_NEXT_ORDERS_FILTERED_EMPTY}
          filteredEmpty={Boolean(appliedHuman)}
        />
      ) : null}

      {!loading && items.length > 0 && (
        <section
          className={`${ADMIN_TABLE_SECTION_CLASS}${refreshing ? ` ${ADMIN_LIST_REFRESHING_SURFACE_CLASS}` : ""}`}
          aria-label={t("admin_orders_table_aria")}
          data-tt-admin-list-refreshing={refreshing ? "1" : undefined}
        >
          <table className={`min-w-full ${ADMIN_TABLE_DIVIDE_CLASS} text-left text-small`}>
            <thead className={ADMIN_TABLE_THEAD_CLASS}>
              <tr>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_orders_colSummary")}
                </th>
                <AdminSortableTh
                  label={t("admin_orders_colState")}
                  ariaSort={ariaSort("state")}
                  onToggle={() => toggle("state")}
                />
                <AdminSortableTh
                  label={t("admin_orders_colAmount")}
                  ariaSort={ariaSort("amount")}
                  onToggle={() => toggle("amount")}
                />
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_orders_colParties")}
                </th>
                <AdminSortableTh
                  label={t("admin_orders_colCreated")}
                  ariaSort={ariaSort("created_at")}
                  onToggle={() => toggle("created_at")}
                />
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_orders_colOps")}
                </th>
              </tr>
            </thead>
            <tbody className={`${ADMIN_TABLE_DIVIDE_CLASS} text-ink-700`}>
              {sortedItems.map((o) => {
                const idShort = shortAdminId(o.id);
                const travelerId = o.tourist_id ?? o.traveler_id;
                const disputed = o.state.trim().toLowerCase() === "disputed";
                return (
                  <tr key={o.id} className={ADMIN_TABLE_ROW_CLASS}>
                    <td className="px-4 py-3">
                      <p className={`${ADMIN_TABLE_TD_MONO_CLASS} font-medium text-ink-900`} title={o.id}>
                        {idShort || t("admin_em_dash")}
                      </p>
                      {o.escrow_address ? (
                        <p className={`mt-0.5 ${ADMIN_TABLE_TD_MONO_CLASS} ${ADMIN_TEXT_MUTED_CLASS}`} title={o.escrow_address}>
                          {t("admin_orders_colEscrow")}: {shortEvmAddress(o.escrow_address)}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className={orderStateBadgeClass(o.state)} title={o.state}>
                        {t(orderStateLabelKey(o.state))}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {formatAdminMoney(o.amount) || o.amount} {o.currency}
                    </td>
                    <td className="px-4 py-3 text-small">
                      <p title={travelerId ?? ""}>
                        {t("admin_orders_party_traveler")}:{" "}
                        {travelerId && canUsersRead ? (
                          <Link
                            href={`/admin/users/${encodeURIComponent(travelerId)}`}
                            className={adminPageNavLinkClass()}
                            data-tt-admin-orders-party-user="traveler"
                          >
                            {shortAdminId(travelerId) || t("admin_em_dash")}
                          </Link>
                        ) : (
                          shortAdminId(travelerId) || t("admin_em_dash")
                        )}
                      </p>
                      <p className="mt-0.5" title={o.guide_id ?? ""}>
                        {t("admin_orders_party_guide")}:{" "}
                        {o.guide_id && canUsersRead ? (
                          <Link
                            href={`/admin/users/${encodeURIComponent(o.guide_id)}`}
                            className={adminPageNavLinkClass()}
                            data-tt-admin-orders-party-user="guide"
                          >
                            {shortAdminId(o.guide_id) || t("admin_em_dash")}
                          </Link>
                        ) : (
                          shortAdminId(o.guide_id) || t("admin_em_dash")
                        )}
                      </p>
                    </td>
                    <td className={`px-4 py-3 ${ADMIN_TABLE_TD_TIMESTAMP_CLASS}`}>
                      {o.created_at ? new Date(o.created_at).toLocaleString() : t("admin_em_dash")}
                    </td>
                    <td className="px-4 py-3">
                      <div className={ADMIN_TABLE_ROW_ACTIONS_CLASS}>
                        <Link
                          href={`/admin/orders/${encodeURIComponent(o.id)}`}
                          className={adminTableRowPrimaryActionClass()}
                          aria-label={t("admin_orders_detail_row_aria", { id: o.id })}
                          data-tt-admin-orders-op="detail"
                        >
                          {t("admin_orders_op_view")}
                        </Link>
                        <Link
                          href={`/escrow/${encodeURIComponent(o.id)}`}
                          onClick={() => stashEscrowOrderPrefetchFromAdminOrderListRow(o)}
                          className={adminTableRowSecondaryActionClass()}
                          aria-label={t("admin_orders_escrow_row_aria", { id: o.id })}
                          data-tt-admin-orders-op="escrow"
                        >
                          {t("admin_ops_orderEscrow")}
                        </Link>
                        {disputed ? (
                          <Link
                            href={`/admin/disputes?orderId=${encodeURIComponent(o.id)}`}
                            className={adminTableRowSecondaryActionClass()}
                            data-tt-admin-orders-op="dispute"
                          >
                            {t("admin_orders_op_dispute")}
                          </Link>
                        ) : null}
                        {/* FO5 · 支付入口降级到「更多」· 可见操作 ≤2 主路径 */}
                        <details className="relative" data-tt-admin-orders-op-more="1">
                          <summary
                            className={`cursor-pointer list-none text-small ${ADMIN_TEXT_META_CLASS} marker:content-none [&::-webkit-details-marker]:hidden`}
                          >
                            {t("admin_orders_op_more")}
                          </summary>
                          <div className="mt-1 flex flex-col gap-1">
                            <Link
                              href={`/pay?orderId=${encodeURIComponent(o.id)}`}
                              onClick={() => stashEscrowOrderPrefetchFromAdminOrderListRow(o)}
                              className={adminTableRowSecondaryActionClass()}
                              aria-label={t("admin_orders_pay_row_aria", { id: o.id })}
                              data-tt-admin-orders-op="pay"
                            >
                              {t("admin_ops_payHub")}
                            </Link>
                          </div>
                        </details>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </AdminListPageChrome>
  );
}
