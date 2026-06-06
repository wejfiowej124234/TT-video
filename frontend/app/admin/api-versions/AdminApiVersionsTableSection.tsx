"use client";

import { useMemo } from "react";
import { AdminSortableTh } from "@/components/admin/AdminSortableTh";
import { useTranslation } from "@/components/LocaleProvider";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";
import {
  ADMIN_TABLE_ROW_CLASS,
  ADMIN_TABLE_THEAD_CLASS,
  ADMIN_TABLE_TH_CELL_CLASS,
  ADMIN_TABLE_SECTION_CLASS,
  ADMIN_TABLE_DIVIDE_CLASS,
  ADMIN_LIST_REFRESHING_SURFACE_CLASS,
} from "@/lib/adminUi";
import type { AdminApiVersionRow } from "./adminApiVersionsPageModel";

type ApiVersionSortKey = "status" | "released_at" | "request_count_7d";

type Props = {
  refreshing: boolean;
  items: AdminApiVersionRow[];
};

export function AdminApiVersionsTableSection({ refreshing, items }: Props) {
  const { t } = useTranslation();
  const { sort, toggle, ariaSort } = useAdminTableSort<ApiVersionSortKey>("released_at", "desc");
  const sortedItems = useMemo(
    () =>
      sortRowsByKey(items, sort.key, sort.dir, (r, key) => {
        if (key === "released_at") return r.released_at ?? "";
        if (key === "request_count_7d") return Number(r.request_count_7d) || 0;
        return r.status ?? "";
      }),
    [items, sort.key, sort.dir],
  );

  if (items.length === 0) {
    return (
      <AdminListPageEmptyState
        messageKey="admin_api_versions_empty"
        nextLinks={[
          { href: "/admin/config", labelKey: "admin_config_hub_title" },
          { href: "/admin/lifecycle", labelKey: "admin_lifecycle_title" },
        ]}
      />
    );
  }

  return (
    <section
      className={`${ADMIN_TABLE_SECTION_CLASS}${refreshing ? ` ${ADMIN_LIST_REFRESHING_SURFACE_CLASS}` : ""}`}
      aria-label={t("admin_api_versions_table_aria")}
      data-tt-admin-list-refreshing={refreshing ? "1" : undefined}
    >
      <table className={`min-w-full ${ADMIN_TABLE_DIVIDE_CLASS} text-left text-small`}>
        <thead className={ADMIN_TABLE_THEAD_CLASS}>
          <tr>
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_api_versions_colVersion")}
            </th>
            <AdminSortableTh
              label={t("admin_api_versions_colStatus")}
              ariaSort={ariaSort("status")}
              onToggle={() => toggle("status")}
            />
            <AdminSortableTh
              label={t("admin_api_versions_colReleased")}
              ariaSort={ariaSort("released_at")}
              onToggle={() => toggle("released_at")}
            />
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_api_versions_colDeprecated")}
            </th>
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_api_versions_colSunset")}
            </th>
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_api_versions_colCompatDays")}
            </th>
            <AdminSortableTh
              label={t("admin_api_versions_colReq7d")}
              ariaSort={ariaSort("request_count_7d")}
              onToggle={() => toggle("request_count_7d")}
            />
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_api_versions_colChanged")}
            </th>
          </tr>
        </thead>
        <tbody className={`${ADMIN_TABLE_DIVIDE_CLASS} text-ink-700`}>
          {sortedItems.map((r: AdminApiVersionRow, i: number) => (
            <tr key={`${r.api_version ?? i}-${i}`} className={ADMIN_TABLE_ROW_CLASS}>
              <td className="px-3 py-2 font-mono text-small text-ink-800">{r.api_version ?? t("admin_em_dash")}</td>
              <td className="px-3 py-2 font-mono text-small text-ink-800">{r.status ?? t("admin_em_dash")}</td>
              <td className="px-3 py-2 font-mono text-meta text-ink-500 whitespace-nowrap">{r.released_at ?? t("admin_em_dash")}</td>
              <td className="px-3 py-2 font-mono text-meta text-ink-500 whitespace-nowrap">{r.deprecated_at ?? t("admin_em_dash")}</td>
              <td className="px-3 py-2 font-mono text-meta text-ink-500 whitespace-nowrap">{r.sunset_at ?? t("admin_em_dash")}</td>
              <td className="px-3 py-2 font-mono text-small text-ink-800">{r.compat_window_days ?? t("admin_em_dash")}</td>
              <td className="px-3 py-2 font-mono text-small text-ink-800">{r.request_count_7d ?? t("admin_em_dash")}</td>
              <td className="px-3 py-2 font-mono text-meta text-ink-500 whitespace-nowrap max-w-[12rem] truncate" title={r.last_change_by}>
                {r.last_change_at ?? t("admin_em_dash")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
