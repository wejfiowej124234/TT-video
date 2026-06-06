"use client";

import Link from "next/link";
import { useMemo } from "react";

import { AdminSortableTh } from "@/components/admin/AdminSortableTh";
import { useTranslation } from "@/components/LocaleProvider";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";
import { slaHint, type DsarRow } from "./adminComplianceRequestsPageModel";
import {
  ADMIN_TABLE_ROW_CLASS,
  ADMIN_TABLE_THEAD_CLASS,
  ADMIN_TABLE_TH_CELL_CLASS,
  adminTableRowPrimaryActionClass,
  adminTableRowSecondaryActionClass,
  ADMIN_TABLE_SECTION_CLASS,
  ADMIN_LIST_REFRESHING_SURFACE_CLASS,
  ADMIN_TABLE_DIVIDE_CLASS,} from "@/lib/adminUi";

type ComplianceSortKey = "status" | "due_at" | "updated_at";

type AdminComplianceRequestsTableSectionProps = {
  items: DsarRow[];
  refreshing?: boolean;
};

export function AdminComplianceRequestsTableSection({
  items,
  refreshing = false,
}: AdminComplianceRequestsTableSectionProps) {
  const { t } = useTranslation();
  const { sort, toggle, ariaSort } = useAdminTableSort<ComplianceSortKey>("due_at", "desc");
  const sortedItems = useMemo(
    () =>
      sortRowsByKey(items, sort.key, sort.dir, (r, key) => {
        if (key === "due_at") return r.due_at ?? r.sla?.due_at ?? "";
        if (key === "updated_at") return r.updated_at ?? r.created_at ?? "";
        return r.status ?? "";
      }),
    [items, sort.key, sort.dir],
  );

  if (items.length === 0) {
    return (
      <AdminListPageEmptyState
        messageKey="admin_compliance_requests_empty"
        nextLinks={[
          { href: "/admin/compliance", labelKey: "admin_compliance_hub_title" },
          { href: "/admin/audit", labelKey: "admin_audit_list_title" },
        ]}
      />
    );
  }

  return (
    <section
      className={`${ADMIN_TABLE_SECTION_CLASS}${refreshing ? ` ${ADMIN_LIST_REFRESHING_SURFACE_CLASS}` : ""}`}
      aria-label={t("admin_compliance_requests_table_aria")}
      data-tt-admin-list-refreshing={refreshing ? "1" : undefined}
    >
      <table className={`min-w-full ${ADMIN_TABLE_DIVIDE_CLASS} text-left text-small`}>
        <thead className={ADMIN_TABLE_THEAD_CLASS}>
          <tr>
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_compliance_requests_colRef")}
            </th>
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_compliance_requests_colType")}
            </th>
            <AdminSortableTh
              label={t("admin_compliance_requests_colStatus")}
              ariaSort={ariaSort("status")}
              onToggle={() => toggle("status")}
            />
            <AdminSortableTh
              label={t("admin_compliance_requests_colSla")}
              ariaSort={ariaSort("due_at")}
              onToggle={() => toggle("due_at")}
            />
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_compliance_requests_colVer")}
            </th>
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_compliance_requests_colEvents")}
            </th>
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_compliance_requests_colUpdate")}
            </th>
          </tr>
        </thead>
        <tbody className={`${ADMIN_TABLE_DIVIDE_CLASS} text-ink-700`}>
          {sortedItems.map((r, idx) => {
            const id = r.id?.trim();
            const dash = t("admin_em_dash");
            const ref = r.request_ref ?? id ?? "";
            return (
              <tr key={id ?? `dsar-${idx}`} className={ADMIN_TABLE_ROW_CLASS}>
                <td className="px-3 py-2 font-mono text-small text-ink-800 max-w-[12rem] truncate" title={r.request_ref}>
                  {r.request_ref ?? dash}
                </td>
                <td className="px-3 py-2 font-mono text-small text-ink-800">{r.request_type ?? dash}</td>
                <td className="px-3 py-2 font-mono text-small text-ink-800">{r.status ?? dash}</td>
                <td
                  className={`px-3 py-2 font-mono text-small text-ink-800 ${r.sla?.overdue ? "text-danger font-semibold" : ""}`}
                  title={r.due_at ?? ""}
                >
                  {slaHint(r.sla, dash)}
                </td>
                <td className="px-3 py-2 font-mono text-small text-ink-800">{r.version ?? dash}</td>
                <td className="px-3 py-2">
                  {id ? (
                    <Link
                      href={`/admin/compliance/requests/${encodeURIComponent(id)}/events`}
                      className={adminTableRowPrimaryActionClass()}
                      aria-label={t("admin_compliance_requests_events_row_aria", { ref: String(ref) })}
                    >
                      {t("admin_compliance_requests_openEvents")}
                    </Link>
                  ) : (
                    dash
                  )}
                </td>
                <td className="px-3 py-2">
                  {id ? (
                    <Link
                      href={`/admin/compliance/requests/${encodeURIComponent(id)}/update`}
                      className={adminTableRowSecondaryActionClass()}
                      aria-label={t("admin_compliance_requests_update_row_aria", { ref: String(ref) })}
                    >
                      {t("admin_compliance_requests_openUpdate")}
                    </Link>
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
