"use client";

import Link from "next/link";
import { useId, useMemo } from "react";

import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminMetaBuildSection, AdminMetaNoteLink } from "@/components/admin/AdminMetaBuildPanel";
import { useTranslation } from "@/components/LocaleProvider";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { adminAuditListPathForAction } from "@/lib/adminAuditNav";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";
import { useAdminAuditOperationsPage } from "./useAdminAuditOperationsPage";

type AuditOpsSortKey = "code" | "kind";
import {
  ADMIN_FILTER_CARD_CLASS,
  ADMIN_FORM_FIELD_FOCUS_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  adminPageNavLinkClass,
  adminTableInlineLinkClass,
} from "@/lib/adminUi";

export function AdminAuditOperationsPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const {
    loading,
    error,
    body,
    meta,
    draftLimit,
    setDraftLimit,
    limit,
    apply,
    reset,
    operationRows,
  } = useAdminAuditOperationsPage();

  const { sort, toggle, ariaSort } = useAdminTableSort<AuditOpsSortKey>("code", "asc");
  const sortedOperationRows = useMemo(
    () =>
      sortRowsByKey(operationRows, sort.key, sort.dir, (row, key) => {
        if (key === "kind") return row.mutating ? "write" : "read";
        return row.code ?? "";
      }),
    [operationRows, sort.key, sort.dir],
  );

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_audit_ops_title")}
      subtitle={t("admin_audit_ops_subtitle")}
      headerAside={
        <>
          <Link href="/admin/audit" className={`${adminPageNavLinkClass()}`}>
            {t("admin_audit_ops_linkLogs")}
          </Link>
          <Link
            href="/admin/observability"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${adminPageNavLinkClass()}`}>
            {t("admin_schema_back")}
          </Link>
        </>
      }
    >
      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      <div className={`mt-5 ${ADMIN_FILTER_CARD_CLASS}`}>
        <form
          id="admin-audit-operations-filter-form"
          aria-label={t("admin_audit_ops_filters_aria")}
          aria-describedby={
            [adminListApplyResetHintId, !loading && !error && body?.applied_filters ? adminAppliedFiltersDescId : ""]
              .filter(Boolean)
              .join(" ")
          }
          onSubmit={apply}
        >
          <h2 className="text-body font-medium text-ink-800">{t("admin_audit_ops_filters_title")}</h2>
          <p id={adminListApplyResetHintId} className="mt-2 text-meta text-ink-600 leading-relaxed">
            {t("admin_list_filters_apply_reset_hint")}
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="text-small text-ink-700">
              {t("admin_audit_ops_limit_label")}
              <input
                className={`mt-1 block min-h-[44px] w-24 rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-2 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                type="number"
                min={1}
                max={200}
                value={draftLimit}
                onChange={(e) => setDraftLimit(e.target.value)}
              />
            </label>
          </div>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          <button form="admin-audit-operations-filter-form" className={ADMIN_PRIMARY_ACTION_BTN_CLASS} type="submit">
            {t("admin_audit_ops_apply")}
          </button>
          <form
            className="inline"
            aria-describedby={adminListApplyResetHintId}
            onSubmit={(e) => {
              e.preventDefault();
              reset();
            }}
          >
            <button
              className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-3 py-2 text-small font-medium text-ink-700 hover:bg-ink-50 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              type="submit"
            >
              {t("admin_audit_ops_reset")}
            </button>
          </form>
        </div>
      </div>

      <section
        className="mt-6 rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4 space-y-4"
        aria-label={t("admin_audit_ops_panel_aria")}
      >
        {loading ? (
          <AdminListLoadingStatus message={t("admin_audit_ops_loading")} className="text-body text-ink-600" />
        ) : error ? (
          <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
        ) : (
          <>
            {body?.applied_filters && (
              <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="panel">
                {t("admin_audit_ops_applied")} {JSON.stringify(body.applied_filters)}
              </AdminAppliedFiltersBanner>
            )}
            {body?.note ? <AdminMetaNoteLink className="mt-2">{body.note}</AdminMetaNoteLink> : null}
            {typeof body?.catalog_total === "number" && typeof body?.returned === "number" ? (
              <p className="text-small text-ink-600">
                {t("admin_audit_ops_catalog_counts")
                  .replace("{total}", String(body.catalog_total))
                  .replace("{returned}", String(body.returned))}
              </p>
            ) : null}
            <div>
              <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">
                {t("admin_audit_ops_operations")}
              </h2>
              {operationRows.length === 0 ? (
                <AdminListPageEmptyState
                  messageKey="admin_audit_ops_empty"
                  nextLinks={[
                    { href: "/admin/audit", labelKey: "admin_audit_list_title" },
                    { href: "/admin/observability", labelKey: "admin_observability_title" },
                  ]}
                />
              ) : (
                <div className="mt-2 max-h-[28rem] overflow-auto rounded-[var(--radius-md)] border border-ink-700/50 bg-ink-900/90">
                  <table className="w-full min-w-[min(100%,36rem)] border-collapse text-left text-meta text-ink-100">
                    <thead className="sticky top-0 z-[1] bg-ink-900/95 backdrop-blur-sm">
                      <tr className="border-b border-ink-700/60">
                        <th scope="col" className="px-3 py-2 font-semibold text-ink-300">
                          {t("admin_audit_ops_col_code")}
                        </th>
                        <th scope="col" className="px-3 py-2 font-semibold text-ink-300 w-[6.5rem]">
                          {t("admin_audit_ops_col_kind")}
                        </th>
                        <th scope="col" className="px-3 py-2 font-semibold text-ink-300 w-[7.5rem] text-right">
                          {t("admin_audit_ops_col_nav")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedOperationRows.map((row) => {
                        const href = adminAuditListPathForAction(row.code, limit);
                        return (
                          <tr key={row.code} className="border-b border-ink-800/80 last:border-b-0">
                            <td className="px-3 py-2 font-mono text-[0.8125rem] break-all text-ink-100">{row.code}</td>
                            <td className="px-3 py-2">
                              <span
                                className={
                                  row.mutating
                                    ? "inline-flex rounded-[var(--radius-sm)] bg-warning/20 px-2 py-0.5 text-warning"
                                    : "inline-flex rounded-[var(--radius-sm)] bg-ink-700/60 px-2 py-0.5 text-ink-300"
                                }
                              >
                                {row.mutating ? t("admin_audit_ops_kind_write") : t("admin_audit_ops_kind_read")}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right align-middle">
                              <Link
                                href={href}
                                className={`${touchTargetLink44Classes} inline-flex ${adminTableInlineLinkClass()}`}
                                aria-label={t("admin_audit_ops_link_logs_aria").replace("{code}", row.code)}
                              >
                                {t("admin_audit_ops_link_logs")}
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </AdminListPageChrome>
  );
}

function AdminAuditOpsSortableTh({
  label,
  ariaSort,
  onToggle,
  className = "",
}: {
  label: string;
  ariaSort: "ascending" | "descending" | "none";
  onToggle: () => void;
  className?: string;
}) {
  const indicator =
    ariaSort === "ascending" ? " ↑" : ariaSort === "descending" ? " ↓" : " ⇅";

  return (
    <th
      scope="col"
      className={`px-3 py-2 font-semibold text-ink-300 ${className}`.trim()}
      aria-sort={ariaSort}
    >
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex min-h-[44px] w-full items-center gap-1 text-left font-semibold text-ink-200 hover:text-white"
      >
        <span>{label}</span>
        <span className="text-meta text-ink-500" aria-hidden>
          {indicator}
        </span>
      </button>
    </th>
  );
}
