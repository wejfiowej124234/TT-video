"use client";

import { useMemo } from "react";
import { AdminSortableTh } from "@/components/admin/AdminSortableTh";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { AdminMetaBuildSection, AdminMetaNoteLink } from "@/components/admin/AdminMetaBuildPanel";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { adminFlagRegionPreview } from "./adminFlagsPageQuery";
import type { AdminFlagRow } from "./adminFlagsPageTypes";
import type { AdminFlagsPageViewModel } from "./useAdminFlagsPage";
import {
  ADMIN_LINK_FOCUS_CLASS,
  ADMIN_TABLE_ROW_CLASS,
  ADMIN_TABLE_THEAD_CLASS,
  ADMIN_TABLE_TH_CELL_CLASS,
  adminTableInlineLinkClass,
} from "@/lib/adminUi";
import { ADMIN_EMPTY_NEXT_FLAGS_EMPTY } from "@/lib/admin/adminListEmptyStateNextLinks";
import { formatAdminAppliedFiltersHuman } from "@/lib/admin/formatAdminAppliedFiltersHuman";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";

type FlagSortKey = "flag_code" | "enabled" | "updated_at";

type Props = Pick<
  AdminFlagsPageViewModel,
  | "t"
  | "loading"
  | "error"
  | "appliedFilters"
  | "items"
  | "meta"
  | "openPublish"
  | "canPublish"
  | "adminAppliedFiltersDescId"
>;

export function AdminFlagsListSection({
  t,
  loading,
  error,
  appliedFilters,
  items,
  meta,
  openPublish,
  canPublish,
  adminAppliedFiltersDescId,
}: Props) {
  const { sort, toggle, ariaSort } = useAdminTableSort<FlagSortKey>("updated_at", "desc");
  const sortedItems = useMemo(
    () =>
      sortRowsByKey(items, sort.key, sort.dir, (r, key) => {
        if (key === "enabled") return r.enabled === true ? 1 : r.enabled === false ? 0 : -1;
        if (key === "updated_at") return r.updated_at ?? "";
        return r.flag_code ?? "";
      }),
    [items, sort.key, sort.dir],
  );

  return (
    <>
      {!loading && !error && appliedFilters ? (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="card" className="mt-6">
          {t("admin_flags_applied")}: {formatAdminAppliedFiltersHuman(appliedFilters, t)}
        </AdminAppliedFiltersBanner>
      ) : null}

      {loading ? (
        <AdminListLoadingStatus message={t("admin_flags_loading")} />
      ) : null}
      {error ? (
        <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
      ) : null}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {!loading && !error && meta?.note ? (
        <AdminMetaNoteLink className="mt-4">{String(meta.note)}</AdminMetaNoteLink>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <AdminListPageEmptyState
          messageKey="admin_flags_empty"
          nextLinks={ADMIN_EMPTY_NEXT_FLAGS_EMPTY}
          filteredEmpty={Boolean(appliedFilters)}
        />
      ) : null}

      {!loading && !error && items.length > 0 && (
        <section
          className="mt-6 overflow-x-auto rounded-[var(--radius-xl)] border border-ink-200 bg-white"
          aria-label={t("admin_flags_table_aria")}
        >
          <table className="min-w-full divide-y divide-ink-100 text-left text-small">
            <thead className={ADMIN_TABLE_THEAD_CLASS}>
              <tr>
                <AdminSortableTh
                  label={t("admin_flags_colCode")}
                  ariaSort={ariaSort("flag_code")}
                  onToggle={() => toggle("flag_code")}
                />
                <AdminSortableTh
                  label={t("admin_flags_colEnabled")}
                  ariaSort={ariaSort("enabled")}
                  onToggle={() => toggle("enabled")}
                />
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_flags_colRollout")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_flags_colScope")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_flags_colRegion")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_flags_colVer")}
                </th>
                <AdminSortableTh
                  label={t("admin_flags_colUpdated")}
                  ariaSort={ariaSort("updated_at")}
                  onToggle={() => toggle("updated_at")}
                />
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_flags_colDesc")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_flags_colAction")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 text-ink-700">
              {sortedItems.map((r: AdminFlagRow, idx: number) => {
                const dash = t("admin_em_dash");
                const reg = adminFlagRegionPreview(r.region, dash);
                const code = r.flag_code ?? r.id ?? "";
                return (
                  <tr key={r.id ?? `ff-${idx}`} className={ADMIN_TABLE_ROW_CLASS}>
                    <td className="px-3 py-2 font-mono text-meta">{r.flag_code ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta">{r.enabled == null ? dash : String(r.enabled)}</td>
                    <td className="px-3 py-2 font-mono text-meta">{r.rollout_percent ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta max-w-[8rem] truncate" title={r.scope ?? ""}>
                      {r.scope ?? dash}
                    </td>
                    <td className="px-3 py-2 font-mono text-meta max-w-[8rem]">
                      <span className="block truncate" title={reg}>
                        {reg}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-meta">{r.version ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">{r.updated_at ?? dash}</td>
                    <td className="px-3 py-2 max-w-xs truncate" title={r.description ?? ""}>
                      {r.description ?? dash}
                    </td>
                    <td className="px-3 py-2">
                      {r.id && canPublish ? (
                        <form
                          className="inline"
                          onSubmit={(e) => {
                            e.preventDefault();
                            openPublish(r);
                          }}
                        >
                          <button
                            type="submit"
                            className={`${adminTableInlineLinkClass()} ${ADMIN_LINK_FOCUS_CLASS}`}
                            aria-label={t("admin_flags_publish_row_aria", { code: String(code) })}
                          >
                            {t("admin_flags_publish")}
                          </button>
                        </form>
                      ) : (
                        dash
                      )}
                    </td>
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
