"use client";

import Link from "next/link";
import { useMemo } from "react";

import { AdminSortableTh } from "@/components/admin/AdminSortableTh";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";
import type { ConfigReleaseRow } from "./configReleasesPageModel";
import type { AdminConfigReleasesPageViewModel } from "./useAdminConfigReleasesPage";
import {
  ADMIN_TABLE_ROW_CLASS,
  ADMIN_TABLE_THEAD_CLASS,
  ADMIN_TABLE_TH_CELL_CLASS,
  adminTableInlineLinkClass,
} from "@/lib/adminUi";

type ReleaseSortKey = "status" | "effective_from" | "updated_at";

type Props = { vm: AdminConfigReleasesPageViewModel };

export function AdminConfigReleasesTableSection({ vm }: Props) {
  const { t, loading, error, items, listQueryString } = vm;
  const { sort, toggle, ariaSort } = useAdminTableSort<ReleaseSortKey>("updated_at", "desc");
  const sortedItems = useMemo(
    () =>
      sortRowsByKey(items, sort.key, sort.dir, (r, key) => {
        if (key === "effective_from") return r.effective_from ?? "";
        if (key === "updated_at") return r.updated_at ?? r.created_at ?? "";
        return r.status ?? "";
      }),
    [items, sort.key, sort.dir],
  );

  if (loading || error) return null;

  if (items.length === 0) {
    return (
      <AdminListPageEmptyState
        messageKey="admin_config_releases_empty"
        nextLinks={[
          { href: "/admin/config", labelKey: "admin_config_hub_title" },
          { href: "/admin/flags", labelKey: "admin_flags_title" },
        ]}
      />
    );
  }

  return (
    <section
      className="mt-6 overflow-x-auto rounded-[var(--radius-xl)] border border-ink-200 bg-white"
      aria-label={t("admin_config_releases_table_aria")}
    >
      <table className="min-w-full divide-y divide-ink-100 text-left text-small">
        <thead className={ADMIN_TABLE_THEAD_CLASS}>
          <tr>
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_config_releases_colKey")}
            </th>
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_config_releases_colLabel")}
            </th>
            <AdminSortableTh
              label={t("admin_config_releases_colStatus")}
              ariaSort={ariaSort("status")}
              onToggle={() => toggle("status")}
            />
            <AdminSortableTh
              label={t("admin_config_releases_colEffective")}
              ariaSort={ariaSort("effective_from")}
              onToggle={() => toggle("effective_from")}
            />
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_config_releases_colRollback")}
            </th>
            <AdminSortableTh
              label={t("admin_config_releases_colUpdated")}
              ariaSort={ariaSort("updated_at")}
              onToggle={() => toggle("updated_at")}
            />
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`} />
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100 text-ink-700">
          {sortedItems.map((r: ConfigReleaseRow, idx: number) => (
            <tr key={r.id ?? `cr-${idx}`} className={ADMIN_TABLE_ROW_CLASS}>
              <td className="px-3 py-2 font-mono text-meta max-w-[12rem] truncate" title={r.release_key}>
                {r.release_key ?? t("admin_em_dash")}
              </td>
              <td className="px-3 py-2 font-mono text-meta">{r.version_label ?? t("admin_em_dash")}</td>
              <td className="px-3 py-2 font-mono text-meta">{r.status ?? t("admin_em_dash")}</td>
              <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">
                {r.effective_from ?? t("admin_em_dash")}
              </td>
              <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">
                {r.rolled_back_at ?? t("admin_em_dash")}
              </td>
              <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">
                {r.updated_at ?? t("admin_em_dash")}
              </td>
              <td className="px-3 py-2 text-right">
                {r.id ? (
                  <Link
                    href={`/admin/config/releases/${encodeURIComponent(r.id)}?relist=${encodeURIComponent(listQueryString)}`}
                    className={adminTableInlineLinkClass()}
                    aria-label={t("admin_config_releases_open_row_aria", { key: String(r.release_key ?? r.id ?? "") })}
                  >
                    {t("admin_config_releases_colOpen")}
                  </Link>
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
