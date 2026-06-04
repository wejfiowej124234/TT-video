"use client";

import Link from "next/link";
import { useId, useMemo, type FormEvent } from "react";
import { AdminSortableTh } from "@/components/admin/AdminSortableTh";

import { AdminAlertError } from "@/components/admin/AdminAlertError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminComplianceDsarWorkflowNotice } from "@/components/admin/AdminComplianceDsarWorkflowNotice";
import { AdminMetaBuildSection, AdminMetaNoteLink } from "@/components/admin/AdminMetaBuildPanel";
import { useTranslation } from "@/components/LocaleProvider";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import {
  COMPLIANCE_EVENTS_EVENT_TYPE_MAX,
  truncComplianceEventDetail,
} from "./adminComplianceRequestEventsPageModel";
import { useAdminComplianceRequestEventsPage } from "./useAdminComplianceRequestEventsPage";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";
import {
  ADMIN_FORM_FIELD_FOCUS_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_TABLE_ROW_CLASS,
  ADMIN_TABLE_THEAD_CLASS,
  ADMIN_TABLE_TH_CELL_CLASS,
  adminPageNavLinkClass,
} from "@/lib/adminUi";

type ComplianceEventSortKey = "occurred_at" | "event_type";

/** 500：DSAR 事件轴只读（须 admin + DB）。 */
export function AdminComplianceRequestEventsPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const limitInputId = useId();
  const eventTypeInputId = useId();
  const adminAppliedFiltersDescId = useId();
  const {
    requestId,
    loading,
    error,
    items,
    meta,
    appliedFilters,
    draftLimit,
    setDraftLimit,
    draftEventType,
    setDraftEventType,
    apply,
  } = useAdminComplianceRequestEventsPage();

  const { sort, toggle, ariaSort } = useAdminTableSort<ComplianceEventSortKey>("occurred_at", "desc");
  const sortedItems = useMemo(
    () =>
      sortRowsByKey(items, sort.key, sort.dir, (r, key) => {
        if (key === "occurred_at") return r.occurred_at ?? "";
        return r.event_type ?? "";
      }),
    [items, sort.key, sort.dir],
  );

  const onSubmit = (e: FormEvent) => apply(e);

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_compliance_events_title")}
      subtitle={
        <>
          <span>{t("admin_compliance_events_subtitle")}</span>
          {requestId ? (
            <p className="mt-2 font-mono text-small text-ink-500 break-all">
              {t("admin_compliance_events_requestId")}: {requestId}
            </p>
          ) : null}
        </>
      }
      headerAside={
        <>
          <Link
            href="/admin/observability"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_observability_title")}
          </Link>
          {requestId ? (
            <Link
              href={`/admin/compliance/requests/${encodeURIComponent(requestId)}/update`}
              className={`${adminPageNavLinkClass()}`}
            >
              {t("admin_compliance_requests_openUpdate")}
            </Link>
          ) : null}
          <Link
            href="/admin/compliance/requests"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_compliance_events_backList")}
          </Link>
          <Link href="/admin" className={`${adminPageNavLinkClass()}`}>
            {t("admin_compliance_events_back")}
          </Link>
        </>
      }
    >
      <AdminComplianceDsarWorkflowNotice />
      {!requestId ? (
        <AdminAlertError className="mt-6" message={t("admin_compliance_events_missingId")} />
      ) : (
        <>
          <form
            className="mt-6 rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
            aria-label={t("admin_compliance_events_filters")}
            aria-describedby={appliedFilters ? adminAppliedFiltersDescId : undefined}
            onSubmit={onSubmit}
          >
            <div className="min-w-[8rem]">
              <label htmlFor={limitInputId} className="block text-small font-medium text-ink-600">
                {t("admin_compliance_events_limit")}
              </label>
              <input
                id={limitInputId}
                type="text"
                inputMode="numeric"
                value={draftLimit}
                onChange={(e) => setDraftLimit(e.target.value)}
                className={`mt-1 min-h-[44px] w-24 rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              />
            </div>
            <div className="min-w-[12rem] flex-1">
              <label htmlFor={eventTypeInputId} className="block text-small font-medium text-ink-600">
                {t("admin_compliance_events_eventType")}
              </label>
              <input
                id={eventTypeInputId}
                type="text"
                value={draftEventType}
                onChange={(e) => setDraftEventType(e.target.value.slice(0, COMPLIANCE_EVENTS_EVENT_TYPE_MAX))}
                className={`mt-1 w-full max-w-md min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 text-small font-mono ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                placeholder={t("admin_compliance_events_eventType_ph")}
                autoComplete="off"
              />
            </div>
            <button type="submit" className={ADMIN_PRIMARY_ACTION_BTN_CLASS}>
              {t("admin_compliance_events_apply")}
            </button>
          </form>

          {appliedFilters ? (
            <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="inline" className="mt-2">
              {t("admin_compliance_events_applied")}: {formatAdminAppliedFiltersHuman(appliedFilters, t)}
            </AdminAppliedFiltersBanner>
          ) : null}

          <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

          {meta?.note ? <AdminMetaNoteLink className="mt-3">{String(meta.note)}</AdminMetaNoteLink> : null}

          {loading ? (
        <AdminListLoadingStatus message={t("admin_compliance_events_loading")} />
      ) : null}
          {error ? <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} /> : null}

          {!loading && !error && items.length === 0 ? (
            <AdminListPageEmptyState
              messageKey="admin_compliance_events_empty"
              nextLinks={[
                { href: "/admin/compliance/requests", labelKey: "admin_compliance_hub_dsar_list" },
                { href: "/admin/compliance", labelKey: "admin_compliance_hub_title" },
              ]}
            />
          ) : null}

          {!loading && !error && items.length > 0 && (
            <section
              className="mt-6 overflow-x-auto rounded-[var(--radius-xl)] border border-ink-200 bg-white"
              aria-label={t("admin_compliance_events_table_aria")}
            >
              <table className="min-w-full divide-y divide-ink-100 text-left text-small">
                <thead className={ADMIN_TABLE_THEAD_CLASS}>
                  <tr>
                    <AdminSortableTh
                      label={t("admin_compliance_events_colTime")}
                      ariaSort={ariaSort("occurred_at")}
                      onToggle={() => toggle("occurred_at")}
                    />
                    <AdminSortableTh
                      label={t("admin_compliance_events_colType")}
                      ariaSort={ariaSort("event_type")}
                      onToggle={() => toggle("event_type")}
                    />
                    <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                      {t("admin_compliance_events_colDetail")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 text-ink-700">
                  {sortedItems.map((r, idx) => {
                    const dash = t("admin_em_dash");
                    return (
                      <tr key={r.id ?? `ev-${idx}`} className={ADMIN_TABLE_ROW_CLASS}>
                        <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">{r.occurred_at ?? dash}</td>
                        <td className="px-3 py-2 font-mono text-meta">{r.event_type ?? dash}</td>
                        <td className="px-3 py-2 max-w-xl font-mono text-meta">
                          <span className="block truncate" title={r.event_detail ?? ""}>
                            {truncComplianceEventDetail(r.event_detail, 200, dash)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          )}
        </>
      )}
    </AdminListPageChrome>
  );
}
