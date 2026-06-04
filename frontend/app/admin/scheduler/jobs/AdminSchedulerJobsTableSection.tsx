"use client";

import { useMemo } from "react";

import { AdminSortableTh } from "@/components/admin/AdminSortableTh";
import { useTranslation } from "@/components/LocaleProvider";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";
import { truncSchedulerCell, type AdminSchedulerJobRow } from "./adminSchedulerJobsPageModel";
import {
  ADMIN_LINK_FOCUS_CLASS,
  ADMIN_TABLE_ROW_CLASS,
  ADMIN_TABLE_THEAD_CLASS,
  ADMIN_TABLE_TH_CELL_CLASS,
  adminTableInlineLinkClass,
} from "@/lib/adminUi";

type SchedulerSortKey = "status" | "started_at";

type AdminSchedulerJobsTableSectionProps = {
  items: AdminSchedulerJobRow[];
  openRerun: (code: string) => void;
};

export function AdminSchedulerJobsTableSection({ items, openRerun }: AdminSchedulerJobsTableSectionProps) {
  const { t } = useTranslation();
  const { sort, toggle, ariaSort } = useAdminTableSort<SchedulerSortKey>("started_at", "desc");
  const sortedItems = useMemo(
    () =>
      sortRowsByKey(items, sort.key, sort.dir, (r, key) => {
        if (key === "started_at") return r.started_at ?? "";
        return r.status ?? "";
      }),
    [items, sort.key, sort.dir],
  );

  if (items.length === 0) {
    return (
      <AdminListPageEmptyState
        messageKey="admin_scheduler_jobs_empty"
        nextLinks={[
          { href: "/admin/jobs", labelKey: "admin_jobs_title" },
          { href: "/admin/observability", labelKey: "admin_observability_title" },
        ]}
      />
    );
  }

  return (
    <section
      className="mt-6 overflow-x-auto rounded-[var(--radius-xl)] border border-ink-200 bg-white"
      aria-label={t("admin_scheduler_jobs_table_aria")}
    >
      <table className="min-w-full divide-y divide-ink-100 text-left text-small">
        <thead className={ADMIN_TABLE_THEAD_CLASS}>
          <tr>
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_scheduler_jobs_colCode")}
            </th>
            <AdminSortableTh
              label={t("admin_scheduler_jobs_colStatus")}
              ariaSort={ariaSort("status")}
              onToggle={() => toggle("status")}
            />
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_scheduler_jobs_colTrigger")}
            </th>
            <AdminSortableTh
              label={t("admin_scheduler_jobs_colStarted")}
              ariaSort={ariaSort("started_at")}
              onToggle={() => toggle("started_at")}
            />
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_scheduler_jobs_colFinished")}
            </th>
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_scheduler_jobs_colError")}
            </th>
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_scheduler_jobs_colRerun")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100 text-ink-700">
          {sortedItems.map((r, idx) => {
            const jc = r.job_code?.trim() ?? "";
            const dash = t("admin_em_dash");
            return (
              <tr key={r.id ?? `sj-${idx}`} className={ADMIN_TABLE_ROW_CLASS}>
                <td className="px-3 py-2 font-mono text-meta max-w-[12rem] truncate" title={r.job_code}>
                  {r.job_code ?? dash}
                </td>
                <td className="px-3 py-2 font-mono text-meta">{r.status ?? dash}</td>
                <td className="px-3 py-2 font-mono text-meta">{r.trigger_source ?? dash}</td>
                <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">{r.started_at ?? dash}</td>
                <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">{r.finished_at ?? dash}</td>
                <td className="px-3 py-2 max-w-md font-mono text-meta">
                  <span className="block truncate" title={r.error_summary ?? ""}>
                    {truncSchedulerCell(r.error_summary, 96, dash)}
                  </span>
                </td>
                <td className="px-3 py-2">
                  {jc ? (
                    <form
                      className="inline"
                      onSubmit={(e) => {
                        e.preventDefault();
                        openRerun(jc);
                      }}
                    >
                      <button
                        type="submit"
                        className={`${adminTableInlineLinkClass()} ${ADMIN_LINK_FOCUS_CLASS}`}
                        aria-label={t("admin_scheduler_jobs_rerun_row_aria", { code: jc })}
                      >
                        {t("admin_scheduler_rerun")}
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
  );
}
