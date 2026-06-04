"use client";



import Link from "next/link";

import { useMemo } from "react";



import { AdminSortableTh } from "@/components/admin/AdminSortableTh";

import { useTranslation } from "@/components/LocaleProvider";

import { ADMIN_EMPTY_NEXT_AUDIT_HUB } from "@/lib/admin/adminListEmptyStateNextLinks";
import { buildAdminAuditLogsPath } from "@/lib/adminAuditLogsPath";

import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";

import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";

import type { AdminAuditPageViewModel } from "./useAdminAuditPage";

import {

  ADMIN_INLINE_LINK_CLASS,

  ADMIN_LINK_FOCUS_CLASS,

  ADMIN_TABLE_ROW_CLASS,

  ADMIN_TABLE_THEAD_CLASS,

  ADMIN_TABLE_TH_CELL_CLASS,

  adminTableInlineLinkClass,

} from "@/lib/adminUi";

import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";



type AuditSortKey = "action" | "created_at";



type Props = Pick<AdminAuditPageViewModel, "listQ" | "items">;



export function AdminAuditTableSection({ listQ, items }: Props) {

  const { t } = useTranslation();

  const { sort, toggle, ariaSort } = useAdminTableSort<AuditSortKey>("created_at", "desc");

  const sortedItems = useMemo(

    () =>

      sortRowsByKey(items, sort.key, sort.dir, (row, key) => {

        if (key === "created_at") return row.created_at ?? "";

        return row.action ?? "";

      }),

    [items, sort.key, sort.dir],

  );



  if (items.length === 0) {

    return (

      <AdminListPageEmptyState

        messageKey="admin_empty_table"

        nextLinks={ADMIN_EMPTY_NEXT_AUDIT_HUB}

      />

    );

  }



  const filterLinkClass = `${touchTargetLink44Classes} font-mono text-meta ${ADMIN_INLINE_LINK_CLASS} ${ADMIN_LINK_FOCUS_CLASS}`;



  return (

    <section

      className="mt-6 overflow-hidden rounded-[var(--radius-xl)] border border-ink-200 bg-white"

      aria-label={t("admin_audit_list_table_aria")}

    >

      <table className="min-w-full divide-y divide-ink-100 text-left text-small">

        <thead className={ADMIN_TABLE_THEAD_CLASS}>

          <tr>

            <AdminSortableTh

              label={t("admin_audit_list_colAction")}

              ariaSort={ariaSort("action")}

              onToggle={() => toggle("action")}

            />

            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>

              {t("admin_audit_list_colResource")}

            </th>

            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>

              {t("admin_audit_list_colActor")}

            </th>

            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>

              {t("admin_audit_list_colRequestId")}

            </th>

            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>

              {t("admin_audit_list_colPayload")}

            </th>

            <AdminSortableTh

              label={t("admin_audit_list_colCreated")}

              ariaSort={ariaSort("created_at")}

              onToggle={() => toggle("created_at")}

            />

            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>

              {t("admin_audit_list_colOps")}

            </th>

          </tr>

        </thead>

        <tbody className="divide-y divide-ink-100 text-ink-700">

          {sortedItems.map((row, idx) => (

            <tr key={row.id ?? `${row.request_id ?? "req"}-${idx}`} className={ADMIN_TABLE_ROW_CLASS}>

              <td className="px-4 py-3 font-mono text-meta">

                {row.action ? (

                  <Link

                    href={buildAdminAuditLogsPath({

                      limit: listQ.limit,

                      actor_id: listQ.actor_id,

                      action: row.action,

                      resource_type: listQ.resource_type,

                    })}

                    className={filterLinkClass}

                    aria-label={t("admin_audit_filterByAction_aria").replace("{action}", row.action)}

                  >

                    {row.action}

                  </Link>

                ) : (

                  t("admin_em_dash")

                )}

              </td>

              <td className="px-4 py-3">

                {row.resource_type?.trim() ? (

                  <Link

                    href={buildAdminAuditLogsPath({

                      limit: listQ.limit,

                      actor_id: listQ.actor_id,

                      action: listQ.action,

                      resource_type: row.resource_type.trim(),

                    })}

                    className={filterLinkClass}

                    aria-label={t("admin_audit_filterByResourceType_aria").replace(

                      "{resource_type}",

                      row.resource_type.trim(),

                    )}

                  >

                    {row.resource_type}:{row.resource_id ?? t("admin_em_dash")}

                  </Link>

                ) : (

                  <>

                    {row.resource_type ?? t("admin_em_dash")}:{row.resource_id ?? t("admin_em_dash")}

                  </>

                )}

              </td>

              <td className="px-4 py-3">

                {row.actor_id?.trim() ? (

                  <Link

                    href={buildAdminAuditLogsPath({

                      limit: listQ.limit,

                      actor_id: row.actor_id.trim(),

                      action: listQ.action,

                      resource_type: listQ.resource_type,

                    })}

                    className={filterLinkClass}

                    aria-label={t("admin_audit_filterByActor_aria").replace("{actor_id}", row.actor_id.trim())}

                  >

                    {row.actor_id}

                  </Link>

                ) : (

                  t("admin_em_dash")

                )}

              </td>

              <td className="px-4 py-3">{row.request_id ?? t("admin_em_dash")}</td>

              <td className="max-w-sm truncate px-4 py-3" title={JSON.stringify(row.payload ?? {})}>

                {JSON.stringify(row.payload ?? {})}

              </td>

              <td className="px-4 py-3">

                {row.created_at ? new Date(row.created_at).toLocaleString() : t("admin_em_dash")}

              </td>

              <td className="px-4 py-3">

                {row.id ? (

                  <Link

                    href={`/admin/audit/logs/${encodeURIComponent(row.id)}`}

                    className={adminTableInlineLinkClass()}

                    aria-label={t("admin_audit_log_detail_row_aria", { id: row.id })}

                  >

                    {t("admin_ops_auditLogDetailAdmin")}

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


