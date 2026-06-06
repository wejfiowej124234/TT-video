"use client";

import { formatAdminAppliedFiltersHuman } from "@/lib/admin/formatAdminAppliedFiltersHuman";

import Link from "next/link";
import { useId, useMemo, type FormEvent } from "react";
import { AdminSortableTh } from "@/components/admin/AdminSortableTh";

import { AdminAlertError } from "@/components/admin/AdminAlertError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { AdminComplianceSectionBackLinks } from "@/components/admin/AdminComplianceSectionBackLinks";
import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminComplianceDsarWorkflowNotice } from "@/components/admin/AdminComplianceDsarWorkflowNotice";
import { AdminMetaBuildSection, AdminMetaNoteLink } from "@/components/admin/AdminMetaBuildPanel";
import { useTranslation } from "@/components/LocaleProvider";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import {
  COMPLIANCE_EVENTS_EVENT_TYPE_MAX,
  truncComplianceEventDetail,
} from "./adminComplianceRequestEventsPageModel";
import { complianceDsarEventsRelatedFoldLinks } from "../../adminComplianceRequestsPageModel";
import { useAdminComplianceRequestEventsPage } from "./useAdminComplianceRequestEventsPage";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";
import {
  ADMIN_FILTER_CARD_CLASS,
  ADMIN_FORM_FIELD_FOCUS_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_TABLE_DIVIDE_CLASS,
  ADMIN_TABLE_ROW_CLASS,
  ADMIN_TABLE_SECTION_CLASS,
  ADMIN_TABLE_THEAD_CLASS,
  ADMIN_TABLE_TH_CELL_CLASS,
  ADMIN_FILTER_INPUT_SM_CLASS,
  adminPageNavLinkClass,
  adminTableRowPrimaryActionClass,
  ADMIN_LIST_REFRESHING_SURFACE_CLASS,
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
    refreshing,
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
          <span>{t("admin_compliance_events_subtitle_l5")}</span>
          {requestId ? (
            <p className="mt-2 font-mono text-small text-ink-500 break-all">
              {t("admin_compliance_events_requestId")}: {requestId}
            </p>
          ) : null}
        </>
      }
      headerAside={
        <AdminComplianceSectionBackLinks>
          <Link
            href="/admin/compliance/requests"
            className={adminPageNavLinkClass()}
            data-tt-admin-compliance-events-back-list="1"
          >
            {t("admin_compliance_events_backList")}
          </Link>
        </AdminComplianceSectionBackLinks>
      }
    >
      {requestId ? (
        <AdminOpsDetailRelatedFold
          relatedLinks={complianceDsarEventsRelatedFoldLinks(requestId)}
          ariaLabelKey="admin_compliance_dsar_related_aria"
          foldSummaryKey="admin_compliance_dsar_related_fold"
          dataTtFold="compliance-events"
        />
      ) : null}
      <AdminComplianceDsarWorkflowNotice />
      {!requestId ? (
        <AdminAlertError className="mt-6" message={t("admin_compliance_events_missingId")} />
      ) : (
        <>
          <form
            className={`mt-6 ${ADMIN_FILTER_CARD_CLASS} flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end`}
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
                className={`mt-1 min-h-[44px] w-24 ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
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
                className={`mt-1 w-full max-w-md min-h-[44px] ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1 text-small font-mono ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
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

          {requestId ? (
            <div className="mt-4 flex flex-wrap gap-3" data-tt-admin-compliance-events-actions="1">
              <Link
                href={`/admin/compliance/requests/${encodeURIComponent(requestId)}/update`}
                className={adminTableRowPrimaryActionClass()}
                data-tt-admin-compliance-events-action-primary="update"
              >
                {t("admin_compliance_requests_openUpdate")}
              </Link>
            </div>
          ) : null}

          {loading && items.length === 0 ? (
        <AdminListLoadingStatus message={t("admin_compliance_events_loading")} />
      ) : null}
          {error ? <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} /> : null}

          {!error && (!loading || items.length > 0) && items.length === 0 ? (
            <AdminListPageEmptyState
              messageKey="admin_compliance_events_empty"
              nextLinks={[
                { href: "/admin/compliance/requests", labelKey: "admin_compliance_hub_dsar_list" },
                { href: "/admin/compliance", labelKey: "admin_compliance_hub_title" },
              ]}
            />
          ) : null}

          {!error && (!loading || items.length > 0) && items.length > 0 && (
            <section
              className={`${ADMIN_TABLE_SECTION_CLASS}${refreshing ? ` ${ADMIN_LIST_REFRESHING_SURFACE_CLASS}` : ""}`}
              aria-label={t("admin_compliance_events_table_aria")}
              data-tt-admin-list-refreshing={refreshing ? "1" : undefined}
            >
              <table className={`min-w-full ${ADMIN_TABLE_DIVIDE_CLASS} text-left text-small`}>
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
                <tbody className={`${ADMIN_TABLE_DIVIDE_CLASS} text-ink-700`}>
                  {sortedItems.map((r, idx) => {
                    const dash = t("admin_em_dash");
                    return (
                      <tr key={r.id ?? `ev-${idx}`} className={ADMIN_TABLE_ROW_CLASS}>
                        <td className="px-3 py-2 font-mono text-meta text-ink-500 whitespace-nowrap">{r.occurred_at ?? dash}</td>
                        <td className="px-3 py-2 font-mono text-small text-ink-800">{r.event_type ?? dash}</td>
                        <td className="px-3 py-2 max-w-xl font-mono text-small text-ink-800">
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
