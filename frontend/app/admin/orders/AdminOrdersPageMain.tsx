"use client";

import Link from "next/link";
import { useId, useMemo } from "react";

import { AdminSortableTh } from "@/components/admin/AdminSortableTh";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";

import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { useTranslation } from "@/components/LocaleProvider";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { ADMIN_EMPTY_NEXT_ORDERS_FILTERED_EMPTY } from "@/lib/admin/adminListEmptyStateNextLinks";
import {
  formatOrdersAppliedFiltersHuman,
  ORDER_STATE_FILTER_OPTIONS,
  orderStateLabelKey,
} from "@/lib/admin/adminOrdersLabels";
import { shortAdminId } from "@/lib/admin/shortAdminId";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { shortEvmAddress } from "@/lib/formatEvmAddress";
import { stashEscrowOrderPrefetchFromAdminOrderListRow } from "@/lib/orderEscrowPrefetch";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { useAdminOrdersPage } from "./useAdminOrdersPage";
import { ADMIN_FILTER_CARD_CLASS, ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_LINK_FOCUS_CLASS, ADMIN_PRIMARY_ACTION_BTN_CLASS, ADMIN_TABLE_ROW_CLASS, ADMIN_TABLE_THEAD_CLASS, ADMIN_TABLE_TH_CELL_CLASS, adminPageNavLinkClass, adminTableInlineLinkClass } from "@/lib/adminUi";

type OrderSortKey = "state" | "amount" | "created_at";

export function AdminOrdersPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const ordersLimitFieldId = useId();
  const ordersStateFieldId = useId();
  const {
    loading,
    error,
    items,
    appliedFilters,
    meta,
    draftLimit,
    setDraftLimit,
    draftState,
    setDraftState,
    apply,
    reset,
  } = useAdminOrdersPage();

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
      subtitle={t("admin_orders_subtitle_l5")}
      headerAside={
        <>
          <Link
            href="/admin/observability"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link
            href="/admin"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_schema_back")}
          </Link>
        </>
      }
    >
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
          <h2 className="text-body font-medium text-ink-800">{t("admin_orders_filters_title")}</h2>
          <p id={adminListApplyResetHintId} className="mt-2 text-meta text-ink-600 leading-relaxed">
            {t("admin_list_filters_apply_reset_hint")}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label htmlFor={ordersLimitFieldId} className="text-small text-ink-700">
              {t("admin_orders_limit_label")}
              <input
                id={ordersLimitFieldId}
                name="limit"
                className={`mt-1 block w-full min-h-[44px] max-w-[8rem] rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-2 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                type="number"
                min={1}
                max={500}
                value={draftLimit}
                onChange={(e) => setDraftLimit(e.target.value)}
              />
            </label>
            <label htmlFor={ordersStateFieldId} className="text-small text-ink-700">
              {t("admin_orders_state_label")}
              <select
                id={ordersStateFieldId}
                name="state"
                className={`mt-1 block w-full min-h-[44px] rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-2 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
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
        <div className="mt-3 flex flex-wrap gap-2">
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
              className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-3 py-2 text-small font-medium text-ink-700 hover:bg-ink-50 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
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

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {!loading && !error && items.length === 0 ? (
        <AdminListPageEmptyState
          messageKey="admin_list_empty_orders"
          nextLinks={ADMIN_EMPTY_NEXT_ORDERS_FILTERED_EMPTY}
          filteredEmpty={Boolean(appliedHuman)}
        />
      ) : null}

      {!loading && !error && items.length > 0 && (
        <section
          className="mt-6 overflow-hidden rounded-[var(--radius-xl)] border border-ink-200 bg-white"
          aria-label={t("admin_orders_table_aria")}
        >
          <table className="min-w-full divide-y divide-ink-100 text-left text-small">
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
            <tbody className="divide-y divide-ink-100 text-ink-700">
              {sortedItems.map((o) => {
                const idShort = shortAdminId(o.id);
                return (
                  <tr key={o.id} className={ADMIN_TABLE_ROW_CLASS}>
                    <td className="px-4 py-3">
                      <p className="font-mono text-meta font-medium text-ink-900" title={o.id}>
                        {idShort || t("admin_em_dash")}
                      </p>
                      {o.escrow_address ? (
                        <p className="mt-0.5 font-mono text-meta text-ink-500" title={o.escrow_address}>
                          {t("admin_orders_colEscrow")}: {shortEvmAddress(o.escrow_address)}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-ink-100 px-2 py-0.5 text-meta font-medium text-ink-800">
                        {t(orderStateLabelKey(o.state))}
                      </span>
                      <span className="mt-0.5 block font-mono text-meta text-ink-400">{o.state}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {o.amount} {o.currency}
                    </td>
                    <td className="px-4 py-3 text-meta">
                      <p title={o.tourist_id ?? o.traveler_id ?? ""}>
                        {t("admin_orders_party_traveler")}:{" "}
                        {shortAdminId(o.tourist_id ?? o.traveler_id) || t("admin_em_dash")}
                      </p>
                      <p className="mt-0.5" title={o.guide_id ?? ""}>
                        {t("admin_orders_party_guide")}: {shortAdminId(o.guide_id) || t("admin_em_dash")}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-meta whitespace-nowrap">
                      {o.created_at ? new Date(o.created_at).toLocaleString() : t("admin_em_dash")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 items-start">
                        <Link
                          href={`/admin/orders/${encodeURIComponent(o.id)}`}
                          className={`${adminTableInlineLinkClass()}`}
                          aria-label={t("admin_orders_detail_row_aria", { id: o.id })}
                        >
                          {t("admin_ops_orderDetailAdmin")}
                        </Link>
                        <Link
                          href={`/escrow/${encodeURIComponent(o.id)}`}
                          onClick={() => stashEscrowOrderPrefetchFromAdminOrderListRow(o)}
                          className={`${adminTableInlineLinkClass()}`}
                          aria-label={t("admin_orders_escrow_row_aria", { id: o.id })}
                        >
                          {t("admin_ops_orderEscrow")}
                        </Link>
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
