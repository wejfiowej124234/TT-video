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
import type { LifecycleStateMachineRow } from "./adminLifecyclePageModel";

type LifecycleSortKey = "machine_code" | "current_state" | "last_transition_at";

type AdminLifecycleTableSectionProps = {
  items: LifecycleStateMachineRow[];
  refreshing: boolean;
};

export function AdminLifecycleTableSection({ items, refreshing }: AdminLifecycleTableSectionProps) {
  const { t } = useTranslation();
  const { sort, toggle, ariaSort } = useAdminTableSort<LifecycleSortKey>("last_transition_at", "desc");
  const sortedItems = useMemo(
    () =>
      sortRowsByKey(items, sort.key, sort.dir, (r, key) => {
        if (key === "last_transition_at") return r.last_transition_at ?? "";
        if (key === "current_state") return r.current_state ?? "";
        return r.machine_code ?? "";
      }),
    [items, sort.key, sort.dir],
  );

  if (items.length === 0) {
    return (
      <AdminListPageEmptyState
        messageKey="admin_lifecycle_empty"
        nextLinks={[
          { href: "/admin/config", labelKey: "admin_config_hub_title" },
          { href: "/admin/observability", labelKey: "admin_observability_title" },
        ]}
      />
    );
  }

  return (
    <section
      className={`${ADMIN_TABLE_SECTION_CLASS}${refreshing ? ` ${ADMIN_LIST_REFRESHING_SURFACE_CLASS}` : ""}`}
      aria-label={t("admin_lifecycle_table_aria")}
      data-tt-admin-list-refreshing={refreshing ? "1" : undefined}
    >
      <table className={`min-w-full ${ADMIN_TABLE_DIVIDE_CLASS} text-left text-small`}>
        <thead className={ADMIN_TABLE_THEAD_CLASS}>
          <tr>
            <AdminSortableTh
              label={t("admin_lifecycle_colCode")}
              ariaSort={ariaSort("machine_code")}
              onToggle={() => toggle("machine_code")}
            />
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_lifecycle_colDomain")}
            </th>
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_lifecycle_colEntity")}
            </th>
            <AdminSortableTh
              label={t("admin_lifecycle_colCurrent")}
              ariaSort={ariaSort("current_state")}
              onToggle={() => toggle("current_state")}
            />
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_lifecycle_colExpected")}
            </th>
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_lifecycle_colAnomaly")}
            </th>
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_lifecycle_colRepair")}
            </th>
            <AdminSortableTh
              label={t("admin_lifecycle_colTransition")}
              ariaSort={ariaSort("last_transition_at")}
              onToggle={() => toggle("last_transition_at")}
            />
          </tr>
        </thead>
        <tbody className={`${ADMIN_TABLE_DIVIDE_CLASS} text-ink-700`}>
          {sortedItems.map((r, idx) => (
            <tr key={`${r.machine_code ?? "m"}-${idx}`} className={ADMIN_TABLE_ROW_CLASS}>
              <td className="px-3 py-2 font-mono text-meta text-ink-500 whitespace-nowrap">{r.machine_code ?? t("admin_em_dash")}</td>
              <td className="px-3 py-2 font-mono text-small text-ink-800">{r.domain ?? t("admin_em_dash")}</td>
              <td className="px-3 py-2 font-mono text-small text-ink-800 max-w-[8rem] truncate" title={r.entity_type}>
                {r.entity_type ?? t("admin_em_dash")}
              </td>
              <td className="px-3 py-2 font-mono text-small text-ink-800">{r.current_state ?? t("admin_em_dash")}</td>
              <td className="px-3 py-2 font-mono text-small text-ink-800">{r.expected_state ?? t("admin_em_dash")}</td>
              <td className="px-3 py-2 font-mono text-small text-ink-800">
                {r.anomaly_flag == null ? t("admin_em_dash") : String(r.anomaly_flag)}
                {r.anomaly_type ? ` / ${r.anomaly_type}` : ""}
              </td>
              <td className="px-3 py-2 font-mono text-small text-ink-800">
                {r.repairable == null ? t("admin_em_dash") : String(r.repairable)}
              </td>
              <td className="px-3 py-2 font-mono text-meta text-ink-500 whitespace-nowrap">{r.last_transition_at ?? t("admin_em_dash")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
