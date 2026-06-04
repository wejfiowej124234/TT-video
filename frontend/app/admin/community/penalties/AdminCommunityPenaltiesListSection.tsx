"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AdminSortableTh } from "@/components/admin/AdminSortableTh";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { AdminMetaBuildSection, AdminMetaNoteLink } from "@/components/admin/AdminMetaBuildPanel";
import { ADMIN_EMPTY_NEXT_COMMUNITY_PENALTIES_EMPTY } from "@/lib/admin/adminListEmptyStateNextLinks";
import { formatAdminAppliedFiltersHuman } from "@/lib/admin/formatAdminAppliedFiltersHuman";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";
import {
  ADMIN_TABLE_ROW_CLASS,
  ADMIN_TABLE_THEAD_CLASS,
  ADMIN_TABLE_TH_CELL_CLASS,
  adminTableInlineLinkClass,
} from "@/lib/adminUi";

type PenaltySortKey = "status" | "created_at" | "expires_at";
import { adminCommunityPenaltyMetaPreview } from "./adminCommunityPenaltiesPageHelpers";
import type { AdminCommunityPenaltyRow } from "./adminCommunityPenaltiesPageTypes";
import type { AdminCommunityPenaltiesPageViewModel } from "./useAdminCommunityPenaltiesPage";

type Props = Pick<
  AdminCommunityPenaltiesPageViewModel,
  | "t"
  | "loading"
  | "error"
  | "appliedFilters"
  | "items"
  | "meta"
  | "adminAppliedFiltersDescId"
>;

export function AdminCommunityPenaltiesListSection({
  t,
  loading,
  error,
  appliedFilters,
  items,
  meta,
  adminAppliedFiltersDescId,
}: Props) {
  const { sort, toggle, ariaSort } = useAdminTableSort<PenaltySortKey>("created_at", "desc");
  const sortedItems = useMemo(
    () =>
      sortRowsByKey(items, sort.key, sort.dir, (r, key) => {
        if (key === "created_at") return r.created_at ?? "";
        if (key === "expires_at") return r.expires_at ?? "";
        return r.status ?? "";
      }),
    [items, sort.key, sort.dir],
  );

  return (
    <>
      {!loading && !error && appliedFilters ? (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="card" className="mt-6">
          {t("admin_penalties_applied")} {formatAdminAppliedFiltersHuman(appliedFilters, t)}
        </AdminAppliedFiltersBanner>
      ) : null}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {meta?.note ? (
        <AdminMetaNoteLink className="mt-3">{String(meta.note)}</AdminMetaNoteLink>
      ) : null}

      {loading ? (
        <AdminListLoadingStatus message={t("admin_penalties_loading")} />
      ) : null}
      {error ? (
        <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <AdminListPageEmptyState
          messageKey="admin_penalties_empty"
          nextLinks={ADMIN_EMPTY_NEXT_COMMUNITY_PENALTIES_EMPTY}
          filteredEmpty={Boolean(appliedFilters)}
        />
      ) : null}

      {!loading && !error && items.length > 0 && (
        <section
          className="mt-6 overflow-x-auto rounded-[var(--radius-xl)] border border-ink-200 bg-white"
          aria-label={t("admin_penalties_table_aria")}
        >
          <table className="min-w-full divide-y divide-ink-100 text-left text-small">
            <thead className={ADMIN_TABLE_THEAD_CLASS}>
              <tr>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_penalties_colAction")}
                </th>
                <AdminSortableTh
                  label={t("admin_penalties_colStatus")}
                  ariaSort={ariaSort("status")}
                  onToggle={() => toggle("status")}
                />
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_penalties_colSubject")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_penalties_colReport")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_penalties_colReason")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_penalties_colBy")}
                </th>
                <AdminSortableTh
                  label={t("admin_penalties_colExpires")}
                  ariaSort={ariaSort("expires_at")}
                  onToggle={() => toggle("expires_at")}
                />
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_penalties_colMeta")}
                </th>
                <AdminSortableTh
                  label={t("admin_penalties_colCreated")}
                  ariaSort={ariaSort("created_at")}
                  onToggle={() => toggle("created_at")}
                />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 text-ink-700">
              {sortedItems.map((r: AdminCommunityPenaltyRow, idx: number) => {
                const dash = t("admin_em_dash");
                return (
                  <tr key={r.id ?? `pen-${idx}`} className={ADMIN_TABLE_ROW_CLASS}>
                    <td className="px-3 py-2 font-mono text-meta">{r.action ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta">{r.status ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta max-w-[8rem] truncate" title={r.subject_user_id}>
                      {r.subject_user_id ?? dash}
                    </td>
                    <td className="px-3 py-2 font-mono text-meta max-w-[8rem] truncate" title={r.report_id ?? ""}>
                      {r.report_id ? (
                        <Link
                          href="/admin/community/reports"
                          className={adminTableInlineLinkClass()}
                          aria-label={t("admin_penalties_report_row_aria", { id: r.report_id })}
                        >
                          {r.report_id}
                        </Link>
                      ) : (
                        dash
                      )}
                    </td>
                    <td className="px-3 py-2 max-w-[10rem] truncate" title={r.reason ?? ""}>
                      {r.reason ?? dash}
                    </td>
                    <td className="px-3 py-2 font-mono text-meta max-w-[8rem] truncate" title={r.created_by}>
                      {r.created_by ?? dash}
                    </td>
                    <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">{r.expires_at ?? dash}</td>
                    <td className="px-3 py-2 max-w-[10rem] font-mono text-meta">
                      <span className="block truncate" title={adminCommunityPenaltyMetaPreview(r.metadata, dash)}>
                        {adminCommunityPenaltyMetaPreview(r.metadata, dash)}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">{r.created_at ?? dash}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}
