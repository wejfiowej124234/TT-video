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
} from "@/lib/adminUi";

import { truncToolAuditField, type InternalToolAuditRow } from "./adminInternalToolAuditsPageModel";

type ToolAuditSortKey = "created_at" | "tool_id" | "action_code";

type AdminInternalToolAuditsTableSectionProps = {
  items: InternalToolAuditRow[];
};

export function AdminInternalToolAuditsTableSection({ items }: AdminInternalToolAuditsTableSectionProps) {
  const { t } = useTranslation();
  const { sort, toggle, ariaSort } = useAdminTableSort<ToolAuditSortKey>("created_at", "desc");
  const sortedItems = useMemo(
    () =>
      sortRowsByKey(items, sort.key, sort.dir, (r, key) => {
        if (key === "created_at") return r.created_at ?? "";
        if (key === "action_code") return r.action_code ?? "";
        return r.tool_id ?? "";
      }),
    [items, sort.key, sort.dir],
  );

  if (items.length === 0) {
    return (
      <AdminListPageEmptyState
        messageKey="admin_tool_audits_empty"
        nextLinks={[
          { href: "/admin/audit", labelKey: "admin_audit_list_title" },
          { href: "/admin/observability", labelKey: "admin_observability_title" },
        ]}
      />
    );
  }

  return (
    <section className="mt-6 overflow-x-auto rounded-[var(--radius-xl)] border border-ink-200 bg-white" aria-label={t("admin_tool_audits_table_aria")}>
      <table className="min-w-full divide-y divide-ink-100 text-left text-small">
        <thead className={ADMIN_TABLE_THEAD_CLASS}>
          <tr>
            <AdminSortableTh
              label={t("admin_tool_audits_colTime")}
              ariaSort={ariaSort("created_at")}
              onToggle={() => toggle("created_at")}
            />
            <AdminSortableTh
              label={t("admin_tool_audits_colTool")}
              ariaSort={ariaSort("tool_id")}
              onToggle={() => toggle("tool_id")}
            />
            <AdminSortableTh
              label={t("admin_tool_audits_colAction")}
              ariaSort={ariaSort("action_code")}
              onToggle={() => toggle("action_code")}
            />
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_tool_audits_colActor")}
            </th>
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_tool_audits_colResource")}
            </th>
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_tool_audits_colApproval")}
            </th>
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_tool_audits_colDigest")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100 text-ink-700">
          {sortedItems.map((r, idx) => {
            const dash = t("admin_em_dash");
            return (
              <tr key={r.id ?? `ita-${idx}`} className={ADMIN_TABLE_ROW_CLASS}>
                <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">{r.created_at ?? dash}</td>
                <td className="px-3 py-2 font-mono text-meta max-w-[10rem]">
                  <span className="block truncate" title={`${r.tool_id ?? ""} ${r.tool_name ?? ""}`}>
                    {r.tool_id ?? dash}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-meta">{r.action_code ?? dash}</td>
                <td className="px-3 py-2 font-mono text-meta max-w-[8rem] truncate" title={r.actor_id}>
                  {r.actor_id ?? dash}
                </td>
                <td className="px-3 py-2 max-w-xs font-mono text-meta">
                  <span className="block truncate" title={r.resource_ref ?? ""}>
                    {truncToolAuditField(r.resource_ref, 64, dash)}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-meta max-w-[8rem] truncate" title={r.approval_request_id ?? ""}>
                  {r.approval_request_id ?? dash}
                </td>
                <td className="px-3 py-2 max-w-[10rem] font-mono text-meta">
                  <span className="block truncate" title={`in: ${r.input_digest ?? ""} out: ${r.result_digest ?? ""}`}>
                    {truncToolAuditField(r.input_digest, 24, dash)} / {truncToolAuditField(r.result_digest, 24, dash)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
