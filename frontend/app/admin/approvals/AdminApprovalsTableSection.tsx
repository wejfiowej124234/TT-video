"use client";

import Link from "next/link";
import { useMemo } from "react";

import { AdminSortableTh } from "@/components/admin/AdminSortableTh";
import { useTranslation } from "@/components/LocaleProvider";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";
import { ADMIN_EMPTY_NEXT_APPROVALS_FILTERED_EMPTY } from "@/lib/admin/adminListEmptyStateNextLinks";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import {
  ADMIN_LINK_FOCUS_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_QUEUE_STATUS_ATTENTION_BADGE_CLASS,
  ADMIN_QUEUE_STATUS_DANGER_BADGE_CLASS,
  ADMIN_QUEUE_STATUS_NEUTRAL_BADGE_CLASS,
  ADMIN_QUEUE_STATUS_SUCCESS_BADGE_CLASS,
  ADMIN_TABLE_ROW_CLASS,
  ADMIN_TABLE_ROW_PENDING_CLASS,
  ADMIN_TABLE_THEAD_CLASS,
  ADMIN_TABLE_TH_CELL_CLASS,
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

export function AdminApprovalsTableSection({ vm }: Props) {
  const { t } = useTranslation();
  const caps = useAdminCapabilities();
  const canAct = caps.permissionsLoaded && caps.hasPermission(ADMIN_PERM.APPROVE);

  const { loading, error, filteredItems, pendingInView, selectedIds, toggleSelect, toggleSelectAllPending } =
    vm;

  const { sort, toggle, ariaSort } = useAdminTableSort<ApprovalSortKey>("created_at", "desc");
  const sortedItems = useMemo(
    () =>
      sortRowsByKey(filteredItems, sort.key, sort.dir, (item, key) => {
        if (key === "created_at") return item.created_at ?? "";
        return item.status ?? "";
      }),
    [filteredItems, sort.key, sort.dir],
  );

  if (loading || error) return null;

  if (filteredItems.length === 0) {
    return (
      <AdminListPageEmptyState
        messageKey="admin_approvals_empty_filtered"
        nextLinks={ADMIN_EMPTY_NEXT_APPROVALS_FILTERED_EMPTY}
      />
    );
  }

  const allPendingSelected =
    pendingInView.length > 0 && pendingInView.every((i) => selectedIds.has(i.id));

  return (
    <section
      className="mt-4 overflow-hidden rounded-[var(--radius-xl)] border border-ink-200 bg-white"
      aria-label={t("admin_approvals_table_aria")}
      data-tt-admin-approvals-table="1"
    >
      <table className="min-w-full divide-y divide-ink-100 text-left text-small">
        <thead className={ADMIN_TABLE_THEAD_CLASS}>
          <tr>
            {canAct ? (
              <th scope="col" className="w-12 px-3 py-3">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  aria-label={t("admin_approvals_select_all_pending")}
                  checked={allPendingSelected}
                  onChange={() => toggleSelectAllPending()}
                />
              </th>
            ) : null}
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_approvals_colSummary")}
            </th>
            <AdminSortableTh
              label={t("admin_approvals_colStatus")}
              ariaSort={ariaSort("status")}
              onToggle={() => toggle("status")}
            />
            <AdminSortableTh
              label={t("admin_approvals_colAge")}
              ariaSort={ariaSort("created_at")}
              onToggle={() => toggle("created_at")}
            />
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_approvals_colOps")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100 text-ink-700">
          {sortedItems.map((item: ApprovalItem) => {
            const id = item.id;
            const isPending = (item.status ?? "").trim() === "pending";
            const selectable = canAct && isPending;
            const age = formatApprovalAge(item.created_at);
            return (
              <tr
                key={id}
                className={
                  isPending
                    ? `${ADMIN_TABLE_ROW_PENDING_CLASS} ${ADMIN_TABLE_ROW_CLASS}`
                    : ADMIN_TABLE_ROW_CLASS
                }
              >
                {canAct ? (
                  <td className="px-3 py-3 align-top">
                    {selectable ? (
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        aria-label={t("admin_approvals_select_row")}
                        checked={selectedIds.has(id)}
                        onChange={() => toggleSelect(id)}
                      />
                    ) : (
                      <span className="text-ink-300" aria-hidden>
                        —
                      </span>
                    )}
                  </td>
                ) : null}
                <td className="px-4 py-3">
                  <p className="font-medium text-ink-900">{t(approvalActionLabelKey(item.action))}</p>
                  <p className="mt-0.5 font-mono text-meta text-ink-500 break-all">{id}</p>
                  <p className="mt-1 text-meta text-ink-600">
                    {item.resource_type ?? t("admin_em_dash")} · {item.resource_id ?? t("admin_em_dash")}
                  </p>
                  <p className="mt-0.5 text-meta text-ink-500">
                    {t("admin_approvals_colRequestedBy")}: {item.requested_by ?? t("admin_em_dash")}
                  </p>
                </td>
                <td className="px-4 py-3 align-top">
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
                </td>
                <td className="px-4 py-3 align-top text-meta text-ink-600">
                  {age ? t("admin_approvals_age_value", { age }) : t("admin_em_dash")}
                </td>
                <td className="px-4 py-3 align-top">
                  <Link
                    href={`/admin/approvals/${encodeURIComponent(id)}`}
                    className={`${touchTargetLink44Classes} ${ADMIN_PRIMARY_ACTION_BTN_CLASS} ${ADMIN_LINK_FOCUS_CLASS}`}
                    aria-label={t("admin_approvals_review_row_aria", { id })}
                  >
                    {isPending ? t("admin_approvals_review_cta") : t("admin_ops_approvalDetailAdmin")}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
