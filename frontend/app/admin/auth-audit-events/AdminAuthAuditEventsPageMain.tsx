"use client";

import { useId, useMemo } from "react";
import { AdminSortableTh } from "@/components/admin/AdminSortableTh";
import { useTranslation } from "@/components/LocaleProvider";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminAuditSectionBackLinks } from "@/components/admin/AdminAuditSectionBackLinks";
import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import type { AuthAuditEventItem } from "@/lib/apiClient/adminAuthAudit/types";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";
import {
  ADMIN_FILTER_ACTIONS_CLASS,
  ADMIN_FILTER_CARD_CLASS,
  ADMIN_FILTER_FIELD_LABEL_CLASS,
  ADMIN_FILTER_GRID_CLASS,
  ADMIN_FILTER_HINT_CLASS,
  ADMIN_FILTER_RESET_BTN_CLASS,
  ADMIN_FORM_FIELD_FOCUS_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_TABLE_ROW_CLASS,
  ADMIN_TABLE_SURFACE_CLASS,
  ADMIN_TABLE_THEAD_CLASS,
  ADMIN_TABLE_TH_CELL_CLASS,
  ADMIN_FILTER_INPUT_SM_CLASS,
  ADMIN_TABLE_DIVIDE_CLASS,
  ADMIN_FILTER_TITLE_CLASS,
  ADMIN_LIST_REFRESHING_SURFACE_CLASS,
} from "@/lib/adminUi";
import type { AdminAuthAuditEventsPageViewModel } from "./useAdminAuthAuditEventsPage";
import { auditPeerRelatedFoldLinks } from "@/lib/admin/adminAuditRelatedFoldLinks";

type Props = AdminAuthAuditEventsPageViewModel;

type AuthAuditSortKey = "created_at" | "event_type" | "reason";

export function AdminAuthAuditEventsPageMain(props: Props) {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const adminListApplyResetHintId = useId();
  const {
    loading,
    refreshing,
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
      subtitle={t("admin_auth_audit_events_subtitle_l5")}
      headerAside={<AdminAuditSectionBackLinks />}
    >
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => reload()}
          disabled={loading && items.length === 0}
          className={`${ADMIN_FILTER_INPUT_SM_CLASS} px-3 py-2 text-small min-h-[44px] ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
          data-tt-admin-auth-audit-refresh="1"
        >
          {t("admin_trust_growth_refresh")}
        </button>
      </div>
      <AdminOpsDetailRelatedFold
        relatedLinks={auditPeerRelatedFoldLinks("/admin/auth-audit-events")}
        ariaLabelKey="admin_audit_detail_related_aria"
        foldSummaryKey="admin_audit_detail_related_fold"
        dataTtFold="auth-audit-events"
      />
      <form
        className={`${ADMIN_FILTER_CARD_CLASS} space-y-3`}
        onSubmit={apply}
        aria-label={t("admin_auth_audit_events_filters")}
        aria-describedby={adminListApplyResetHintId}
      >
        <h2 className={ADMIN_FILTER_TITLE_CLASS}>{t("admin_auth_audit_events_filters")}</h2>
        <p id={adminListApplyResetHintId} className={ADMIN_FILTER_HINT_CLASS}>
          {t("admin_list_filters_apply_reset_hint")}
        </p>
        <div className={ADMIN_FILTER_GRID_CLASS}>
          <label className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
            {t("admin_auth_audit_events_limit")}
            <input
              className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              value={draftLimit}
              onChange={(e) => setDraftLimit(e.target.value)}
            />
          </label>
          <label className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
            {t("admin_auth_audit_events_event_type")}
            <input
              className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              value={draftEventType}
              onChange={(e) => setDraftEventType(e.target.value)}
              placeholder={t("admin_auth_audit_events_event_type_ph")}
            />
          </label>
          <label className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
            {t("admin_auth_audit_events_reason")}
            <input
              className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              value={draftReason}
              onChange={(e) => setDraftReason(e.target.value)}
            />
          </label>
          <label className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
            {t("admin_auth_audit_events_user_id")}
            <input
              className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 text-small font-mono ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              value={draftUserId}
              onChange={(e) => setDraftUserId(e.target.value)}
            />
          </label>
        </div>
        <FilterActionsBar t={t} reset={reset} loading={loading} />
      </form>

      {loading && items.length === 0 ? (
        <AdminListLoadingStatus message={t("admin_loading")} className="text-body text-ink-500" />
      ) : null}
      {error ? <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} /> : null}

      {!error && (!loading || items.length > 0) ? (
        <AuthAuditEventsTable t={t} items={items} refreshing={refreshing} />
      ) : null}
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
    <div className={ADMIN_FILTER_ACTIONS_CLASS}>
      <button type="submit" disabled={loading} className={ADMIN_PRIMARY_ACTION_BTN_CLASS}>
        {t("admin_audit_list_apply")}
      </button>
      <button
        type="button"
        onClick={reset}
        disabled={loading}
        className={`${ADMIN_FILTER_RESET_BTN_CLASS} min-h-[44px] ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
      >
        {t("admin_audit_list_reset")}
      </button>
    </div>
  );
}

function AuthAuditEventsTable({
  t,
  items,
  refreshing,
}: {
  t: (k: string) => string;
  items: AuthAuditEventItem[];
  refreshing: boolean;
}) {
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
      className={`${ADMIN_TABLE_SURFACE_CLASS}${refreshing ? ` ${ADMIN_LIST_REFRESHING_SURFACE_CLASS}` : ""}`}
      aria-label={t("admin_auth_audit_events_title")}
      data-tt-admin-list-refreshing={refreshing ? "1" : undefined}
    >
      <table className={`min-w-full ${ADMIN_TABLE_DIVIDE_CLASS} text-left text-small`}>
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
        <tbody className={`${ADMIN_TABLE_DIVIDE_CLASS} text-ink-700`}>
          {sortedItems.map((row) => (
            <tr
              key={String(row.id ?? `${row.event_type}-${row.created_at}`)}
              className={ADMIN_TABLE_ROW_CLASS}
            >
              <td className="px-3 py-2 font-mono text-meta text-ink-500 whitespace-nowrap">{row.created_at ?? t("admin_em_dash")}</td>
              <td className="px-3 py-2 font-mono text-small text-ink-800">{row.event_type ?? t("admin_em_dash")}</td>
              <td className="px-3 py-2 font-mono text-small text-ink-800">{row.reason ?? t("admin_em_dash")}</td>
              <td className="px-3 py-2 font-mono text-small text-ink-800 max-w-[12rem] truncate" title={row.user_id ?? undefined}>
                {row.user_id ?? t("admin_em_dash")}
              </td>
              <td className="px-3 py-2 font-mono text-small text-ink-800">{row.client_ip ?? t("admin_em_dash")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
