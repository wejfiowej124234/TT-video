"use client";

import Link from "next/link";
import { useMemo } from "react";

import { AdminSortableTh } from "@/components/admin/AdminSortableTh";
import { useTranslation } from "@/components/LocaleProvider";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { ADMIN_EMPTY_NEXT_REVIEWS_EMPTY } from "@/lib/admin/adminListEmptyStateNextLinks";
import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";
import { stashEscrowOrderPrefetchForOrderIdNav } from "@/lib/orderEscrowPrefetch";
import {
  ADMIN_TABLE_ROW_CLASS,
  ADMIN_TABLE_THEAD_CLASS,
  ADMIN_TABLE_TH_CELL_CLASS,
  adminTableInlineLinkClass,
} from "@/lib/adminUi";
import type { AdminReviewRow } from "./adminReviewsPageModel";

type ReviewSortKey = "score" | "created_at";

type Props = {
  loading: boolean;
  error: AdminFetchErrorKind | null;
  itemsNotArrayError: boolean;
  items: AdminReviewRow[];
};

export function AdminReviewsTableSection({ loading, error, itemsNotArrayError, items }: Props) {
  const { t } = useTranslation();
  const { sort, toggle, ariaSort } = useAdminTableSort<ReviewSortKey>("created_at", "desc");
  const sortedItems = useMemo(
    () =>
      sortRowsByKey(items, sort.key, sort.dir, (r, key) => {
        if (key === "score") return Number(r.score) || 0;
        return r.created_at ?? "";
      }),
    [items, sort.key, sort.dir],
  );

  if (loading || error || itemsNotArrayError) return null;

  if (items.length === 0) {
    return (
      <AdminListPageEmptyState
        messageKey="admin_empty_table"
        nextLinks={ADMIN_EMPTY_NEXT_REVIEWS_EMPTY}
      />
    );
  }

  return (
    <section className="mt-6 overflow-hidden rounded-[var(--radius-xl)] border border-ink-200 bg-white" aria-label={t("admin_reviews_table_aria")}>
      <table className="min-w-full divide-y divide-ink-100 text-left text-small">
        <thead className={ADMIN_TABLE_THEAD_CLASS}>
          <tr>
            <AdminSortableTh
              label={t("admin_reviews_colScore")}
              ariaSort={ariaSort("score")}
              onToggle={() => toggle("score")}
            />
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_reviews_colOrder")}
            </th>
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_reviews_colReviewer")}
            </th>
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_reviews_colComment")}
            </th>
            <AdminSortableTh
              label={t("admin_reviews_colCreated")}
              ariaSort={ariaSort("created_at")}
              onToggle={() => toggle("created_at")}
            />
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_reviews_colOps")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100 text-ink-700">
          {sortedItems.map((r) => (
            <tr key={r.id ?? `${r.order_id}-${r.reviewer_id}`} className={ADMIN_TABLE_ROW_CLASS}>
              <td className="px-4 py-3 font-mono">{r.score ?? t("admin_em_dash")}</td>
              <td className="px-4 py-3 font-mono text-meta break-all">{r.order_id ?? t("admin_em_dash")}</td>
              <td className="px-4 py-3 font-mono text-meta break-all">
                {r.reviewer_id ? `${r.reviewer_id.slice(0, 8)}…` : t("admin_em_dash")}
              </td>
              <td className="px-4 py-3 max-w-md truncate" title={r.comment ?? undefined}>
                {r.comment?.trim() ? r.comment : t("admin_em_dash")}
              </td>
              <td className="px-4 py-3">
                {r.created_at ? new Date(r.created_at).toLocaleString() : t("admin_em_dash")}
              </td>
              <td className="px-4 py-3">
                {r.order_id ? (
                  <div className="flex flex-col gap-1 items-start">
                    {r.id ? (
                      <Link
                        href={`/admin/reviews/${encodeURIComponent(r.id)}`}
                        className={adminTableInlineLinkClass()}
                        aria-label={t("admin_reviews_detail_row_aria", { id: r.id ?? "" })}
                      >
                        {t("admin_ops_reviewDetailAdmin")}
                      </Link>
                    ) : null}
                    <Link
                      href={`/escrow/${encodeURIComponent(r.order_id)}`}
                      onClick={() => {
                        const oid = r.order_id;
                        if (oid) stashEscrowOrderPrefetchForOrderIdNav(oid, "escrow");
                      }}
                      className={adminTableInlineLinkClass()}
                      aria-label={t("admin_reviews_escrow_row_aria", { id: r.order_id ?? "" })}
                    >
                      {t("admin_ops_orderEscrow")}
                    </Link>
                    <Link
                      href={`/pay?orderId=${encodeURIComponent(r.order_id)}`}
                      onClick={() => {
                        const oid = r.order_id;
                        if (oid) stashEscrowOrderPrefetchForOrderIdNav(oid, "pay");
                      }}
                      className={adminTableInlineLinkClass()}
                    >
                      {t("admin_ops_orderPay")}
                    </Link>
                  </div>
                ) : (
                  t("admin_em_dash")
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
