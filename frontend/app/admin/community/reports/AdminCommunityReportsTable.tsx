"use client";

import { type FormEvent, useMemo } from "react";
import { AdminSortableTh } from "@/components/admin/AdminSortableTh";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";
import type { LocaleTranslateFn } from "@/lib/i18n";
import { reportReasonCodeIsMapped, reportReasonLabel, reportStatusLabel } from "./adminCommunityReportsLabels";
import type { ReportRow } from "./adminCommunityReportsTypes";
import {
  ADMIN_QUEUE_STATUS_ATTENTION_BADGE_CLASS,
  adminTableRowPrimaryActionClass,
  ADMIN_QUEUE_STATUS_NEUTRAL_BADGE_CLASS,
  ADMIN_TABLE_ROW_CLASS,
  ADMIN_TABLE_ROW_PENDING_CLASS,
  ADMIN_TABLE_THEAD_CLASS,
  ADMIN_TABLE_TH_CELL_CLASS,
  ADMIN_TABLE_SECTION_CLASS,
  ADMIN_LIST_REFRESHING_SURFACE_CLASS,
  ADMIN_TABLE_DIVIDE_CLASS,
} from "@/lib/adminUi";

type ReportSortKey = "status" | "created_at";

export function AdminCommunityReportsTable({
  items,
  refreshing = false,
  t,
  openMod,
  canModerate,
}: {
  items: ReportRow[];
  refreshing?: boolean;
  t: LocaleTranslateFn;
  openMod: (r: ReportRow) => void;
  canModerate: boolean;
}) {
  const { sort, toggle, ariaSort } = useAdminTableSort<ReportSortKey>("created_at", "desc");
  const sortedItems = useMemo(
    () =>
      sortRowsByKey(items, sort.key, sort.dir, (r, key) => {
        if (key === "created_at") return r.created_at ?? "";
        return r.status ?? "";
      }),
    [items, sort.key, sort.dir],
  );

  return (
    <section
      className={`${ADMIN_TABLE_SECTION_CLASS}${refreshing ? ` ${ADMIN_LIST_REFRESHING_SURFACE_CLASS}` : ""}`}
      aria-label={t("admin_community_reports_table_aria")}
      data-tt-admin-reports-table="1"
      data-tt-admin-list-refreshing={refreshing ? "1" : undefined}
    >
      <table className={`min-w-full ${ADMIN_TABLE_DIVIDE_CLASS} text-left text-small`}>
        <thead className={ADMIN_TABLE_THEAD_CLASS}>
          <tr>
            <AdminSortableTh
              label={t("admin_community_reports_colStatus")}
              ariaSort={ariaSort("status")}
              onToggle={() => toggle("status")}
            />
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_community_reports_colTarget")}
            </th>
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_community_reports_colReason")}
            </th>
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_community_reports_colDetails")}
            </th>
            <AdminSortableTh
              label={t("admin_community_reports_colCreated")}
              ariaSort={ariaSort("created_at")}
              onToggle={() => toggle("created_at")}
            />
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_reports_colModerate")}
            </th>
          </tr>
        </thead>
        <tbody className={`${ADMIN_TABLE_DIVIDE_CLASS} text-ink-700`}>
          {sortedItems.map((r, idx) => {
            const dash = t("admin_em_dash");
            const details = r.details?.trim() || dash;
            const isOpen = (r.status ?? "").trim() === "open";
            return (
              <tr
                key={r.id ?? `report-${idx}`}
                className={
                  isOpen ? `${ADMIN_TABLE_ROW_PENDING_CLASS} ${ADMIN_TABLE_ROW_CLASS}` : ADMIN_TABLE_ROW_CLASS
                }
              >
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-meta font-medium ${
                      isOpen ? ADMIN_QUEUE_STATUS_ATTENTION_BADGE_CLASS : ADMIN_QUEUE_STATUS_NEUTRAL_BADGE_CLASS
                    }`}
                  >
                    {reportStatusLabel(r.status, t)}
                  </span>
                </td>
                <td className="px-3 py-2 text-meta max-w-[12rem]">
                  <span className="block truncate" title={`${r.target_type ?? ""} ${r.target_id ?? ""}`}>
                    {r.target_type ?? dash}
                  </span>
                  <span className="font-mono text-small text-ink-800 text-ink-500 block truncate">{r.target_id ?? dash}</span>
                </td>
                <td className="px-3 py-2">
                  <span
                    className="inline-flex rounded-full border border-ref-sun/22 bg-ref-sun/6 px-2 py-0.5 text-small font-medium text-ink-800"
                    title={r.reason_code ?? undefined}
                  >
                    {reportReasonLabel(r.reason_code, t)}
                  </span>
                  {r.reason_code && !reportReasonCodeIsMapped(r.reason_code) ? (
                    <span className="mt-0.5 block font-mono text-meta text-ink-500">{r.reason_code}</span>
                  ) : null}
                </td>
                <td className="px-3 py-2 max-w-xs">
                  <span className="block truncate" title={details}>
                    {details}
                  </span>
                </td>
                <td className="px-3 py-2 text-meta whitespace-nowrap">
                  {r.created_at ? new Date(r.created_at).toLocaleString() : dash}
                </td>
                <td className="px-3 py-2">
                  {r.id && canModerate ? (
                    <form
                      className="inline"
                      onSubmit={(e: FormEvent) => {
                        e.preventDefault();
                        openMod(r);
                      }}
                    >
                      <button
                        type="submit"
                        className={adminTableRowPrimaryActionClass()}
                        aria-label={t("admin_reports_moderate_row_aria", { id: r.id ?? "" })}
                      >
                        {t("admin_reports_wizard_open")}
                      </button>
                    </form>
                  ) : (
                    <span className="text-ink-500">{dash}</span>
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
