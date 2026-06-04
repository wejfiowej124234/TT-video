"use client";

import { useMemo } from "react";
import { AdminSortableTh } from "@/components/admin/AdminSortableTh";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { formatAdminAppliedFiltersHuman } from "@/lib/admin/formatAdminAppliedFiltersHuman";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { AdminMetaBuildSection, AdminMetaNoteLink } from "@/components/admin/AdminMetaBuildPanel";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import type { AdminTenantScopesPageViewModel } from "./useAdminTenantScopesPage";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";
import {
  ADMIN_TABLE_ROW_CLASS,
  ADMIN_TABLE_THEAD_CLASS,
  ADMIN_TABLE_TH_CELL_CLASS,
  adminTableInlineLinkClass,
} from "@/lib/adminUi";

type TenantScopeSortKey = "tenant_key" | "status" | "updated_at";
type Props = Pick<
  AdminTenantScopesPageViewModel,
  | "t"
  | "loading"
  | "error"
  | "appliedFilters"
  | "items"
  | "meta"
  | "openPublish"
  | "adminAppliedFiltersDescId"
>;

export function AdminTenantScopesListSection({
  t,
  loading,
  error,
  appliedFilters,
  items,
  meta,
  openPublish,
  adminAppliedFiltersDescId,
}: Props) {
  const { sort, toggle, ariaSort } = useAdminTableSort<TenantScopeSortKey>("updated_at", "desc");
  const sortedItems = useMemo(
    () =>
      sortRowsByKey(items, sort.key, sort.dir, (r, key) => {
        if (key === "updated_at") return r.updated_at ?? "";
        if (key === "status") return r.status ?? "";
        return r.tenant_key ?? "";
      }),
    [items, sort.key, sort.dir],
  );

  return (
    <>
      {!loading && !error && appliedFilters ? (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="card" className="mt-6">
          {t("admin_tenant_scopes_applied")}: {formatAdminAppliedFiltersHuman(appliedFilters, t)}
        </AdminAppliedFiltersBanner>
      ) : null}

      {loading ? (
        <AdminListLoadingStatus message={t("admin_tenant_scopes_loading")} />
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
          messageKey="admin_tenant_scopes_empty"
          nextLinks={[
            { href: "/admin/config", labelKey: "admin_config_hub_title" },
            { href: "/admin/policies", labelKey: "admin_policies_title" },
          ]}
        />
      ) : null}

      {!loading && !error && items.length > 0 && (
        <section
          className="mt-6 overflow-x-auto rounded-[var(--radius-xl)] border border-ink-200 bg-white"
          aria-label={t("admin_tenant_scopes_table_aria")}
        >
          <table className="min-w-full divide-y divide-ink-100 text-left text-small">
            <thead className={ADMIN_TABLE_THEAD_CLASS}>
              <tr>
                <AdminSortableTh
                  label={t("admin_tenant_scopes_colTenant")}
                  ariaSort={ariaSort("tenant_key")}
                  onToggle={() => toggle("tenant_key")}
                />
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_tenant_scopes_colRegion")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_tenant_scopes_colClass")}
                </th>
                <AdminSortableTh
                  label={t("admin_tenant_scopes_colStatus")}
                  ariaSort={ariaSort("status")}
                  onToggle={() => toggle("status")}
                />
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_tenant_scopes_colVer")}
                </th>
                <AdminSortableTh
                  label={t("admin_tenant_scopes_colUpdated")}
                  ariaSort={ariaSort("updated_at")}
                  onToggle={() => toggle("updated_at")}
                />
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_tenant_scopes_colAction")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 text-ink-700">
              {sortedItems.map((r, idx) => {
                const dash = t("admin_em_dash");
                return (
                  <tr key={r.id ?? `ts-${idx}`} className={ADMIN_TABLE_ROW_CLASS}>
                    <td className="px-3 py-2 font-mono text-meta max-w-[10rem] truncate" title={r.tenant_key}>
                      {r.tenant_key ?? dash}
                    </td>
                    <td className="px-3 py-2 font-mono text-meta">{r.region_code ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta">{r.scope_class ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta">{r.status ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta">{r.version ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">{r.updated_at ?? dash}</td>
                    <td className="px-3 py-2">
                      {r.id ? (
                        <form
                          className="inline"
                          onSubmit={(e) => {
                            e.preventDefault();
                            openPublish(r);
                          }}
                        >
                          <button
                            type="submit"
                            className={adminTableInlineLinkClass()}
                            aria-label={t("admin_tenant_scopes_publish_row_aria", {
                              tenant: String(r.tenant_key ?? r.id ?? ""),
                            })}
                          >
                            {t("admin_tenant_scopes_publish")}
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
