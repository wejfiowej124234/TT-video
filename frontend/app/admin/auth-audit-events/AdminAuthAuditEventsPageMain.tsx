"use client";

import Link from "next/link";
import { useId, useMemo } from "react";
import { AdminSortableTh } from "@/components/admin/AdminSortableTh";
import { useTranslation } from "@/components/LocaleProvider";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import type { AuthAuditEventItem } from "@/lib/apiClient/adminAuthAudit/types";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";
import {
  ADMIN_FILTER_CARD_CLASS,
  ADMIN_FORM_FIELD_FOCUS_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_TABLE_ROW_CLASS,
  ADMIN_TABLE_THEAD_CLASS,
  ADMIN_TABLE_TH_CELL_CLASS,
  adminPageNavLinkClass,
} from "@/lib/adminUi";
import type { AdminAuthAuditEventsPageViewModel } from "./useAdminAuthAuditEventsPage";

type Props = AdminAuthAuditEventsPageViewModel;

type AuthAuditSortKey = "created_at" | "event_type" | "reason";

export function AdminAuthAuditEventsPageMain(props: Props) {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const {
    loading,
    error,
    items,
    draftLimit,
    setDraftLimit,
    draftEventType,
    setDraftEventType,
    draftReason,
    setDraftReason,
    draftUserId,
    setDraftUserId,
    apply,
    reset,
    reload,
  } = props;

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_auth_audit_events_title")}
      headerAside={
        <>
          <button
            type="button"
            onClick={() => void reload()}
            disabled={loading}
            className={`rounded-[var(--radius-sm)] border border-ink-300 px-3 py-2 text-small min-h-[44px] ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
          >
            {t("admin_trust_growth_refresh")}
          </button>
          <Link href="/admin" className={adminPageNavLinkClass()}>
            {t("admin_schema_back")}
          </Link>
          <Link href="/admin/audit" className={adminPageNavLinkClass()}>
            {t("admin_audit_list_title")}
          </Link>
        </>
      }
    >
      <form className={`${ADMIN_FILTER_CARD_CLASS} space-y-3`} onSubmit={apply}>
        <h2 className="text-body font-medium text-ink-800">{t("admin_auth_audit_events_filters")}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-meta text-ink-600">
            {t("admin_auth_audit_events_limit")}
            <input
              className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 px-2 py-1.5 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              value={draftLimit}
              onChange={(e) => setDraftLimit(e.target.value)}
            />
          </label>
          <label className="block text-meta text-ink-600">
            {t("admin_auth_audit_events_event_type")}
            <input
              className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 px-2 py-1.5 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              value={draftEventType}
              onChange={(e) => setDraftEventType(e.target.value)}
              placeholder={t("admin_auth_audit_events_event_type_ph")}
            />
          </label>
          <label className="block text-meta text-ink-600">
            {t("admin_auth_audit_events_reason")}
            <input
              className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 px-2 py-1.5 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              value={draftReason}
              onChange={(e) => setDraftReason(e.target.value)}
            />
          </label>
          <label className="block text-meta text-ink-600">
            {t("admin_auth_audit_events_user_id")}
            <input
              className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 px-2 py-1.5 text-small font-mono ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              value={draftUserId}
              onChange={(e) => setDraftUserId(e.target.value)}
            />
          </label>
        </div>
        <FilterActionsBar t={t} reset={reset} loading={loading} />
      </form>

      {loading ? (
        <AdminListLoadingStatus message={t("admin_loading")} className="text-body text-ink-500" />
      ) : null}
      {error ? <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} /> : null}

      {!loading && !error ? <AuthAuditEventsTable t={t} items={items} /> : null}
    </AdminListPageChrome>
  );
}

function FilterActionsBar({
  t,
  reset,
  loading,
}: {
  t: (k: string) => string;
  reset: () => void;
  loading: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button type="submit" disabled={loading} className={ADMIN_PRIMARY_ACTION_BTN_CLASS}>
        {t("admin_audit_list_apply")}
      </button>
      <button
        type="button"
        onClick={reset}
        disabled={loading}
        className={`rounded-[var(--radius-sm)] border border-ink-300 px-4 py-2 text-small min-h-[44px] ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
      >
        {t("admin_audit_list_reset")}
      </button>
    </div>
  );
}

function AuthAuditEventsTable({ t, items }: { t: (k: string) => string; items: AuthAuditEventItem[] }) {
  const { sort, toggle, ariaSort } = useAdminTableSort<AuthAuditSortKey>("created_at", "desc");
  const sortedItems = useMemo(
    () =>
      sortRowsByKey(items, sort.key, sort.dir, (row, key) => {
        if (key === "created_at") return row.created_at ?? "";
        if (key === "reason") return row.reason ?? "";
        return row.event_type ?? "";
      }),
    [items, sort.key, sort.dir],
  );

  if (items.length === 0) {
    return (
      <AdminListPageEmptyState
        messageKey="admin_auth_audit_events_empty"
        nextLinks={[
          { href: "/admin/permissions", labelKey: "admin_shell_nav_permissions" },
          { href: "/admin/audit", labelKey: "admin_audit_list_title" },
        ]}
      />
    );
  }

  return (
    <div
      className="overflow-x-auto rounded-[var(--radius-xl)] border border-ink-200 bg-white"
      aria-label={t("admin_auth_audit_events_title")}
    >
      <table className="min-w-full divide-y divide-ink-100 text-left text-small">
        <thead className={ADMIN_TABLE_THEAD_CLASS}>
          <tr>
            <AdminSortableTh
              label={t("admin_auth_audit_events_th_created")}
              ariaSort={ariaSort("created_at")}
              onToggle={() => toggle("created_at")}
            />
            <AdminSortableTh
              label={t("admin_auth_audit_events_th_event")}
              ariaSort={ariaSort("event_type")}
              onToggle={() => toggle("event_type")}
            />
            <AdminSortableTh
              label={t("admin_auth_audit_events_th_reason")}
              ariaSort={ariaSort("reason")}
              onToggle={() => toggle("reason")}
            />
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_auth_audit_events_th_user")}
            </th>
            <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
              {t("admin_auth_audit_events_th_ip")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100 text-ink-700">
          {sortedItems.map((row) => (
            <tr
              key={String(row.id ?? `${row.event_type}-${row.created_at}`)}
              className={ADMIN_TABLE_ROW_CLASS}
            >
              <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">{row.created_at ?? t("admin_em_dash")}</td>
              <td className="px-3 py-2 font-mono text-meta">{row.event_type ?? t("admin_em_dash")}</td>
              <td className="px-3 py-2 font-mono text-meta">{row.reason ?? t("admin_em_dash")}</td>
              <td className="px-3 py-2 font-mono text-meta max-w-[12rem] truncate" title={row.user_id ?? undefined}>
                {row.user_id ?? t("admin_em_dash")}
              </td>
              <td className="px-3 py-2 font-mono text-meta">{row.client_ip ?? t("admin_em_dash")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
