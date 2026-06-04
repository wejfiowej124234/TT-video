"use client";

import Link from "next/link";
import { useId } from "react";

import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminAlertError } from "@/components/admin/AdminAlertError";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { useTranslation } from "@/components/LocaleProvider";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { adminAuditLogDetailFieldListHref } from "@/lib/adminAuditLogsPath";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import {
  AUDIT_LOG_DETAIL_ROWS,
  auditDetailLinkFieldForRowKey,
  formatAuditLogDetailValue,
} from "./adminAuditLogDetailPageModel";
import { useAdminAuditLogDetailPage } from "./useAdminAuditLogDetailPage";
import { ADMIN_FILTER_CARD_CLASS, ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";
export function AdminAuditLogDetailPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const { logId, loading, error, row, meta } = useAdminAuditLogDetailPage();

  return (
    <AdminDetailPageChrome
      titleId={pageTitleId}
      title={t("admin_audit_detail_title")}
      subtitle={
        <>
          <p className="font-mono text-meta break-all">{logId || t("admin_em_dash")}</p>
          <p className="mt-1 text-small text-ink-500">{t("admin_audit_detail_subtitle")}</p>
        </>
      }
      headerAside={
        <>
          <Link href="/admin/audit" className={`${adminPageNavLinkClass()}`}>
            {t("admin_audit_detail_back_list")}
          </Link>
          <Link href="/admin/audit/operations" className={`${adminPageNavLinkClass()}`}>
            {t("admin_audit_detail_link_ops")}
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

      <section className="mt-6 space-y-4" aria-label={t("admin_audit_detail_panel_aria")}>
        {!logId ? (
          <AdminAlertError message={t("admin_audit_detail_missingId")} />
        ) : loading ? (
            <AdminListLoadingStatus message={t("admin_loading")} className="text-body text-ink-600" />
          ) : error ? (
          <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
        ) : !row ? (
          <p className="text-body text-ink-600">{t("admin_em_dash")}</p>
        ) : (
          <div className={`${ADMIN_FILTER_CARD_CLASS} shadow-soft`}>
            <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">
              {t("admin_audit_detail_section")}
            </h2>
            <dl className="mt-3 grid gap-2 text-body sm:grid-cols-1">
              {AUDIT_LOG_DETAIL_ROWS.map(({ key, labelKey }) => {
                const raw = row[key];
                const display =
                  key === "created_at" && typeof raw === "string"
                    ? new Date(raw).toLocaleString()
                    : formatAuditLogDetailValue(raw) || t("admin_em_dash");
                const linkField = auditDetailLinkFieldForRowKey(key);
                const filterHref = linkField ? adminAuditLogDetailFieldListHref(linkField, raw) : null;
                const linkAria =
                  filterHref && linkField === "action" && typeof raw === "string"
                    ? t("admin_audit_filterByAction_aria").replace("{action}", raw.trim())
                    : filterHref && linkField === "actor_id" && typeof raw === "string"
                      ? t("admin_audit_filterByActor_aria").replace("{actor_id}", raw.trim())
                      : filterHref && linkField === "resource_type" && typeof raw === "string"
                        ? t("admin_audit_filterByResourceType_aria").replace("{resource_type}", raw.trim())
                        : "";
                return (
                  <div key={key} className="border-b border-ink-100 pb-2 last:border-0">
                    <dt className="text-meta text-ink-500">{t(labelKey)}</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap break-all font-mono text-meta text-ink-800">
                      {filterHref && linkAria ? (
                        <Link
                          href={filterHref}
                          className={`${adminPageNavLinkClass()}`}
                          aria-label={linkAria}
                        >
                          {typeof raw === "string" ? raw : display}
                        </Link>
                      ) : (
                        display
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        )}
      </section>
    </AdminDetailPageChrome>
  );
}
