"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AdminSortableTh } from "@/components/admin/AdminSortableTh";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminAlertError } from "@/components/admin/AdminAlertError";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { ADMIN_EMPTY_NEXT_USERS_FILTERED_EMPTY } from "@/lib/admin/adminListEmptyStateNextLinks";
import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";
import {
  ADMIN_INLINE_LINK_CLASS,
  ADMIN_LINK_FOCUS_CLASS,
  ADMIN_TABLE_ROW_CLASS,
  ADMIN_TABLE_THEAD_CLASS,
  ADMIN_TABLE_TH_CELL_CLASS,
  adminTableRowPrimaryActionClass,
  adminTableRowSecondaryActionClass,
  ADMIN_TABLE_SECTION_CLASS,
  ADMIN_LIST_REFRESHING_SURFACE_CLASS,
  ADMIN_TABLE_DIVIDE_CLASS,
  ADMIN_ACQUISITION_SUSPENDED_ROW_BADGE_CLASS,} from "@/lib/adminUi";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";
import type { AdminUser } from "./adminUsersPageTypes";
import { formatAdminAppliedFiltersHuman } from "@/lib/admin/formatAdminAppliedFiltersHuman";
import type { LocaleTranslateFn } from "@/lib/i18n";

type UserSortKey = "email" | "role" | "created_at";

export function AdminUsersDataSection({
  adminAppliedFiltersDescId,
  loading,
  refreshing = false,
  error,
  appliedFilters,
  items,
  meta,
  fetchErrorUserText,
  openRoleModal,
  openSuspendModal,
  quickLiftSuspend,
  suspendInlineUserId,
  suspendInlineError,
  suspendInlineErrorKind,
  t,
}: {
  adminAppliedFiltersDescId: string;
  loading: boolean;
  refreshing?: boolean;
  error: AdminFetchErrorKind | null;
  appliedFilters: Record<string, unknown> | null;
  items: AdminUser[];
  meta: Record<string, unknown> | null;
  fetchErrorUserText: (k: AdminFetchErrorKind) => string;
  openRoleModal: (u: AdminUser) => void;
  openSuspendModal: (u: AdminUser) => void;
  quickLiftSuspend: (u: AdminUser) => void;
  suspendInlineUserId: string | null;
  suspendInlineError: string | null;
  suspendInlineErrorKind: AdminFetchErrorKind | null;
  t: LocaleTranslateFn;
}) {
  const { sort, toggle, ariaSort } = useAdminTableSort<UserSortKey>("created_at", "desc");
  const sortedItems = useMemo(
    () =>
      sortRowsByKey(items, sort.key, sort.dir, (u, key) => {
        if (key === "created_at") return u.created_at ?? "";
        if (key === "role") return u.role ?? "";
        return u.email ?? "";
      }),
    [items, sort.key, sort.dir],
  );

  return (
    <>
      {loading ? (
        <AdminListLoadingStatus message={t("admin_users_loading")} />
      ) : null}

      {error ? <AdminListFetchError errorKind={error} message={fetchErrorUserText(error)} /> : null}

      {!loading && !error && appliedFilters && (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="card">
          {t("admin_users_applied")} {formatAdminAppliedFiltersHuman(appliedFilters, t)}
        </AdminAppliedFiltersBanner>
      )}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {suspendInlineError && suspendInlineErrorKind ? (
        <AdminAlertError className="mt-6" message={suspendInlineError} errorKind={suspendInlineErrorKind} />
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <AdminListPageEmptyState
          messageKey="admin_users_empty"
          nextLinks={ADMIN_EMPTY_NEXT_USERS_FILTERED_EMPTY}
          filteredEmpty={Boolean(appliedFilters)}
        />
      ) : null}

      {!loading && items.length > 0 && (
        <section
          className={`${ADMIN_TABLE_SECTION_CLASS}${refreshing ? ` ${ADMIN_LIST_REFRESHING_SURFACE_CLASS}` : ""}`}
          aria-label={t("admin_users_table_aria")}
          data-tt-admin-list-refreshing={refreshing ? "1" : undefined}
        >
          <table className={`min-w-full ${ADMIN_TABLE_DIVIDE_CLASS} text-left text-small`}>
            <thead className={ADMIN_TABLE_THEAD_CLASS}>
              <tr>
                <AdminSortableTh
                  label={t("admin_users_colEmail")}
                  ariaSort={ariaSort("email")}
                  onToggle={() => toggle("email")}
                />
                <AdminSortableTh
                  label={t("admin_users_colRole")}
                  ariaSort={ariaSort("role")}
                  onToggle={() => toggle("role")}
                />
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_users_colKyc")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_users_colAcquisitionSuspend")}
                </th>
                <AdminSortableTh
                  label={t("admin_users_colCreated")}
                  ariaSort={ariaSort("created_at")}
                  onToggle={() => toggle("created_at")}
                />
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_users_colAction")}
                </th>
              </tr>
            </thead>
            <tbody className={`${ADMIN_TABLE_DIVIDE_CLASS} text-ink-700`}>
              {sortedItems.map((u) => (
                <tr key={u.id} className={ADMIN_TABLE_ROW_CLASS}>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.role}</td>
                  <td className="px-4 py-3">{u.kyc_status ?? t("admin_em_dash")}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 items-start">
                      {u.acquisition_publish_suspended === true ? (
                        <Link
                          href={`/admin/users/${encodeURIComponent(u.id)}#admin-acquisition-suspend`}
                          className={`${ADMIN_ACQUISITION_SUSPENDED_ROW_BADGE_CLASS} ${travelFocusRingOffset2Classes}`}
                          aria-label={t("admin_users_acquisition_suspend_row_aria", { email: u.email })}
                        >
                          {t("admin_users_acquisitionSuspendedBadge")}
                        </Link>
                      ) : (
                        <span className="text-meta text-ink-500">{t("admin_users_acquisitionNotSuspended")}</span>
                      )}
                      <button
                        type="button"
                        className={`${touchTargetLink44Classes} !justify-start text-left whitespace-nowrap ${ADMIN_INLINE_LINK_CLASS} ${ADMIN_LINK_FOCUS_CLASS}`}
                        aria-label={t("admin_users_acquisitionSuspendManage_aria", { email: u.email })}
                        onClick={() => openSuspendModal(u)}
                      >
                        {t("admin_users_acquisitionSuspendManage")}
                      </button>
                      {u.acquisition_publish_suspended === true ? (
                        <button
                          type="button"
                          className={`${touchTargetLink44Classes} !justify-start text-left whitespace-nowrap ${ADMIN_INLINE_LINK_CLASS} ${ADMIN_LINK_FOCUS_CLASS}`}
                          disabled={suspendInlineUserId === u.id}
                          aria-label={t("admin_users_acquisitionLiftInline_aria", { email: u.email })}
                          onClick={() => quickLiftSuspend(u)}
                        >
                          {suspendInlineUserId === u.id
                            ? t("admin_users_acquisitionLiftInlineLoading")
                            : t("admin_users_acquisitionLiftInline")}
                        </button>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-meta whitespace-nowrap">
                    {u.created_at ? new Date(u.created_at).toLocaleString() : t("admin_em_dash")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 items-start">
                      <Link
                        href={`/admin/users/${encodeURIComponent(u.id)}`}
                        className={adminTableRowPrimaryActionClass()}
                        aria-label={t("admin_users_detail_row_aria", { email: u.email })}
                      >
                        {t("admin_ops_userDetailAdmin")}
                      </Link>
                      <button
                        type="button"
                        className={adminTableRowSecondaryActionClass()}
                        aria-label={t("admin_users_roleRequest_aria", { email: u.email })}
                        onClick={() => openRoleModal(u)}
                      >
                        {t("admin_users_roleRequest")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}
