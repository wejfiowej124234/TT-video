"use client";

import { useMemo } from "react";
import { AdminSortableTh } from "@/components/admin/AdminSortableTh";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { formatAdminAppliedFiltersHuman } from "@/lib/admin/formatAdminAppliedFiltersHuman";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { AdminMetaBuildSection, AdminMetaNoteLink } from "@/components/admin/AdminMetaBuildPanel";
import { adminErrorUserText, type AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { adminPolicyResourcesPreview } from "./adminPoliciesPageHelpers";
import type { AdminPolicyRow } from "./adminPoliciesPageTypes";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";
import {
  ADMIN_TABLE_ROW_CLASS,
  ADMIN_TABLE_THEAD_CLASS,
  ADMIN_TABLE_TH_CELL_CLASS,
  adminTableInlineLinkClass,
} from "@/lib/adminUi";

type PolicySortKey = "code" | "pstatus" | "updated_at";

type TFn = (key: string, params?: Record<string, string>) => string;

export type AdminPoliciesListSectionProps = {
  t: TFn;
  loading: boolean;
  error: AdminFetchErrorKind | null;
  appliedFilters: Record<string, unknown> | null;
  items: AdminPolicyRow[];
  meta: Record<string, unknown> | null;
  openPublish: (row: AdminPolicyRow) => void;
  adminAppliedFiltersDescId: string;
};

export function AdminPoliciesListSection(props: AdminPoliciesListSectionProps) {
  const { t, loading, error, appliedFilters, items, meta, openPublish, adminAppliedFiltersDescId } = props;
  const { sort, toggle, ariaSort } = useAdminTableSort<PolicySortKey>("updated_at", "desc");
  const sortedItems = useMemo(
    () =>
      sortRowsByKey(items, sort.key, sort.dir, (row, key) => {
        if (key === "updated_at") return row.updated_at ?? "";
        if (key === "pstatus") return row.policy?.status ?? "";
        return row.policy?.code ?? row.id ?? "";
      }),
    [items, sort.key, sort.dir],
  );

  return (
    <>
      {!loading && !error && appliedFilters ? (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="card" className="mt-6">
          {t("admin_policies_applied")}: {formatAdminAppliedFiltersHuman(appliedFilters, t)}
        </AdminAppliedFiltersBanner>
      ) : null}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {meta?.note ? <AdminMetaNoteLink className="mt-4">{String(meta.note)}</AdminMetaNoteLink> : null}

      {loading ? (
        <AdminListLoadingStatus message={t("admin_policies_loading")} />
      ) : null}
      {error ? <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} /> : null}

      {!loading && !error && items.length === 0 ? (
        <AdminListPageEmptyState
          messageKey="admin_policies_empty"
          nextLinks={[
            { href: "/admin/flags", labelKey: "admin_flags_title" },
            { href: "/admin/permissions", labelKey: "admin_shell_nav_permissions" },
          ]}
        />
      ) : null}

      {!loading && !error && items.length > 0 && (
        <section
          className="mt-6 overflow-x-auto rounded-[var(--radius-xl)] border border-ink-200 bg-white"
          aria-label={t("admin_policies_table_aria")}
        >
          <table className="min-w-full divide-y divide-ink-100 text-left text-small">
            <thead className={ADMIN_TABLE_THEAD_CLASS}>
              <tr>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_policies_colId")}
                </th>
                <AdminSortableTh
                  label={t("admin_policies_colCode")}
                  ariaSort={ariaSort("code")}
                  onToggle={() => toggle("code")}
                />
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_policies_colPVer")}
                </th>
                <AdminSortableTh
                  label={t("admin_policies_colPStatus")}
                  ariaSort={ariaSort("pstatus")}
                  onToggle={() => toggle("pstatus")}
                />
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_policies_colScope")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_policies_colRole")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_policies_colResources")}
                </th>
                <AdminSortableTh
                  label={t("admin_policies_colUpdated")}
                  ariaSort={ariaSort("updated_at")}
                  onToggle={() => toggle("updated_at")}
                />
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_policies_colAction")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 text-ink-700">
              {sortedItems.map((row, idx) => {
                const dash = t("admin_em_dash");
                const p = row.policy;
                const sc = row.scope;
                const b = row.binding;
                const resStr = adminPolicyResourcesPreview(b?.resources, dash);
                const code = p?.code ?? row.id ?? "";
                return (
                  <tr key={row.id ?? `pol-${idx}`} className={ADMIN_TABLE_ROW_CLASS}>
                    <td className="px-3 py-2 font-mono text-meta max-w-[7rem] truncate" title={row.id}>
                      {row.id ?? dash}
                    </td>
                    <td className="px-3 py-2 font-mono text-meta">{p?.code ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta">{p?.version ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta">{p?.status ?? dash}</td>
                    <td className="px-3 py-2 max-w-[10rem]">
                      <span className="block font-mono text-meta truncate" title={sc?.expr ?? ""}>
                        {sc?.type ?? dash}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-meta">{b?.role ?? dash}</td>
                    <td className="px-3 py-2 max-w-[12rem] font-mono text-meta">
                      <span className="block truncate" title={resStr}>
                        {resStr}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">{row.updated_at ?? dash}</td>
                    <td className="px-3 py-2">
                      {row.id ? (
                        <form
                          className="inline"
                          onSubmit={(e) => {
                            e.preventDefault();
                            openPublish(row);
                          }}
                        >
                          <button
                            type="submit"
                            className={adminTableInlineLinkClass()}
                            aria-label={t("admin_policies_publish_row_aria", { code: String(code) })}
                          >
                            {t("admin_policies_publish")}
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
