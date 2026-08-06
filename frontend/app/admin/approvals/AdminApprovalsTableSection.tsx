"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";
import { ADMIN_EMPTY_NEXT_APPROVALS_FILTERED_EMPTY } from "@/lib/admin/adminListEmptyStateNextLinks";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import {
  adminTableRowPrimaryActionClass,
  ADMIN_APPROVAL_QUEUE_ROW_CARD_CLASS,
  ADMIN_QUEUE_STATUS_ATTENTION_BADGE_CLASS,
  ADMIN_QUEUE_STATUS_DANGER_BADGE_CLASS,
  ADMIN_QUEUE_STATUS_NEUTRAL_BADGE_CLASS,
  ADMIN_QUEUE_STATUS_SUCCESS_BADGE_CLASS,
  ADMIN_LIST_REFRESHING_SURFACE_CLASS,
  ADMIN_FILTER_CHIP_ACTIVE_CLASS,
  ADMIN_FILTER_CHIP_IDLE_CLASS,
} from "@/lib/adminUi";
import {
  approvalActionLabelKey,
  approvalStatusLabelKey,
  formatApprovalAge,
} from "./adminApprovalWorkflowModel";
import type { ApprovalItem } from "./adminApprovalsPageModel";
import type { AdminApprovalsPageViewModel } from "./useAdminApprovalsPage";

type ApprovalSortKey = "status" | "created_at";

type Props = {
  vm: AdminApprovalsPageViewModel;
};

/** Batch-9 U2 · 审批主壳 = Warm 卡列表（禁白底大表）。 */
export function AdminApprovalsTableSection({ vm }: Props) {
  const { t } = useTranslation();
  const caps = useAdminCapabilities();
  const canAct = caps.permissionsLoaded && caps.hasPermission(ADMIN_PERM.APPROVE);

  const { loading, refreshing, error, filteredItems, pendingInView, selectedIds, toggleSelect, toggleSelectAllPending } =
    vm;

  const { sort, toggle } = useAdminTableSort<ApprovalSortKey>("created_at", "desc");
  const sortedItems = useMemo(
    () =>
      sortRowsByKey(filteredItems, sort.key, sort.dir, (item, key) => {
        if (key === "created_at") return item.created_at ?? "";
        return item.status ?? "";
      }),
    [filteredItems, sort.key, sort.dir],
  );

  if (error || (loading && filteredItems.length === 0)) return null;

  if (filteredItems.length === 0) {
    const hasActiveFilters =
      vm.listSearch.trim() !== "" ||
      (vm.listQ.status !== undefined && vm.listQ.status !== "pending");
    const messageKey =
      !hasActiveFilters && vm.items.length === 0
        ? "admin_approvals_empty"
        : "admin_approvals_empty_filtered";
    return (
      <AdminListPageEmptyState
        messageKey={messageKey}
        nextLinks={ADMIN_EMPTY_NEXT_APPROVALS_FILTERED_EMPTY}
      />
    );
  }

  const allPendingSelected =
    pendingInView.length > 0 && pendingInView.every((i) => selectedIds.has(i.id));

  return (
    <section
      className={`mt-4 space-y-3${refreshing ? ` ${ADMIN_LIST_REFRESHING_SURFACE_CLASS}` : ""}`}
      aria-label={t("admin_approvals_card_list_aria")}
      data-tt-admin-list-refreshing={refreshing ? "1" : undefined}
      data-tt-admin-approvals-card-list="1"
    >
      <div
        className="flex flex-wrap items-center gap-2"
        role="toolbar"
        aria-label={t("admin_approvals_sort_toolbar_aria")}
      >
        {canAct ? (
          <label className="mr-2 inline-flex items-center gap-2 text-meta text-ink-400">
            <input
              type="checkbox"
              className="h-4 w-4"
              aria-label={t("admin_approvals_select_all_pending")}
              checked={allPendingSelected}
              onChange={() => toggleSelectAllPending()}
            />
            {t("admin_approvals_select_all_pending")}
          </label>
        ) : null}
        <button
          type="button"
          className={`rounded-full px-2.5 py-1 text-meta ${
            sort.key === "created_at" ? ADMIN_FILTER_CHIP_ACTIVE_CLASS : ADMIN_FILTER_CHIP_IDLE_CLASS
          }`}
          onClick={() => toggle("created_at")}
        >
          {t("admin_approvals_colAge")}
          {sort.key === "created_at" ? (sort.dir === "desc" ? " ↓" : " ↑") : ""}
        </button>
        <button
          type="button"
          className={`rounded-full px-2.5 py-1 text-meta ${
            sort.key === "status" ? ADMIN_FILTER_CHIP_ACTIVE_CLASS : ADMIN_FILTER_CHIP_IDLE_CLASS
          }`}
          onClick={() => toggle("status")}
        >
          {t("admin_approvals_colStatus")}
          {sort.key === "status" ? (sort.dir === "desc" ? " ↓" : " ↑") : ""}
        </button>
      </div>

      <ul className="space-y-3">
        {sortedItems.map((item: ApprovalItem) => {
          const id = item.id;
          const isPending = (item.status ?? "").trim() === "pending";
          const selectable = canAct && isPending;
          const age = formatApprovalAge(item.created_at);
          return (
            <li key={id} className={ADMIN_APPROVAL_QUEUE_ROW_CARD_CLASS}>
              <div className="flex flex-wrap items-start gap-3">
                {canAct ? (
                  <div className="pt-1">
                    {selectable ? (
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        aria-label={t("admin_approvals_select_row")}
                        checked={selectedIds.has(id)}
                        onChange={() => toggleSelect(id)}
                      />
                    ) : (
                      <span className="text-ink-600" aria-hidden>
                        —
                      </span>
                    )}
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="text-small font-semibold text-[#ffe8d4]">
                    {t(approvalActionLabelKey(item.action))}
                  </p>
                  <p className="mt-1 text-meta text-ink-400">
                    {item.resource_type ?? t("admin_em_dash")} · {item.resource_id ?? t("admin_em_dash")}
                  </p>
                  <p className="mt-0.5 text-meta text-ink-500">
                    {t("admin_approvals_colRequestedBy")}: {item.requested_by ?? t("admin_em_dash")}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-meta font-medium ${
                        isPending
                          ? ADMIN_QUEUE_STATUS_ATTENTION_BADGE_CLASS
                          : (item.status ?? "") === "approved"
                            ? ADMIN_QUEUE_STATUS_SUCCESS_BADGE_CLASS
                            : (item.status ?? "") === "rejected"
                              ? ADMIN_QUEUE_STATUS_DANGER_BADGE_CLASS
                              : ADMIN_QUEUE_STATUS_NEUTRAL_BADGE_CLASS
                      }`}
                    >
                      {t(approvalStatusLabelKey(item.status))}
                    </span>
                    <span className="text-meta text-ink-500">
                      {age ? t("admin_approvals_age_value", { age }) : t("admin_em_dash")}
                    </span>
                  </div>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-meta text-ink-500">
                      {t("admin_approvals_technical_id_fold")}
                    </summary>
                    <p className="mt-1 font-mono text-meta text-ink-500 break-all">{id}</p>
                  </details>
                </div>
                <Link
                  href={`/admin/approvals/${encodeURIComponent(id)}`}
                  className={adminTableRowPrimaryActionClass()}
                  aria-label={t("admin_approvals_review_row_aria", { id })}
                  {...(isPending ? { "data-tt-admin-approvals-review-cta": "1" } : {})}
                >
                  {isPending ? t("admin_approvals_review_cta") : t("admin_ops_approvalDetailAdmin")}
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
