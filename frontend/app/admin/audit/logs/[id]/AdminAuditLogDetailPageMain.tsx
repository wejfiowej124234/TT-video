"use client";

import { AdminDetailContentPanel } from "@/components/admin/AdminDetailContentPanel";
import Link from "next/link";
import { useId } from "react";

import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminAuditSectionBackLinks } from "@/components/admin/AdminAuditSectionBackLinks";
import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminAlertError } from "@/components/admin/AdminAlertError";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { useTranslation } from "@/components/LocaleProvider";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { adminAuditLogDetailFieldListHref } from "@/lib/adminAuditLogsPath";
import {
  AUDIT_LOG_DETAIL_RELATED_FOLD_LINKS,
  AUDIT_LOG_DETAIL_ROWS,
  auditDetailLinkFieldForRowKey,
  formatAuditLogDetailValue,
} from "./adminAuditLogDetailPageModel";
import { useAdminAuditLogDetailPage } from "./useAdminAuditLogDetailPage";
import { ADMIN_DETAIL_FIELD_ROW_SIMPLE_CLASS, adminPageNavLinkClass, ADMIN_LIST_REFRESHING_SURFACE_CLASS } from "@/lib/adminUi";
export function AdminAuditLogDetailPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const { logId, loading, refreshing, error, row, meta } = useAdminAuditLogDetailPage();

  return (
    <AdminDetailPageChrome
      titleId={pageTitleId}
      title={t("admin_audit_detail_title")}
      subtitle={
        <>
          <p className="font-mono text-small text-ink-800 break-all">{logId || t("admin_em_dash")}</p>
          <p className="mt-1 text-small text-ink-500">{t("admin_audit_detail_subtitle_l5")}</p>
        </>
      }
      headerAside={<AdminAuditSectionBackLinks />}
    >
      <AdminOpsDetailRelatedFold
        relatedLinks={AUDIT_LOG_DETAIL_RELATED_FOLD_LINKS}
        ariaLabelKey="admin_audit_detail_related_aria"
        foldSummaryKey="admin_audit_detail_related_fold"
        dataTtFold="audit-log"
      />
      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      <section className="mt-6 space-y-4" aria-label={t("admin_audit_detail_panel_aria")}>
        {!logId ? (
          <AdminAlertError message={t("admin_audit_detail_missingId")} />
        ) : loading && !row ? (
            <AdminListLoadingStatus message={t("admin_loading")} className="text-body text-ink-600" />
          ) : error && !row ? (
          <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
        ) : !row ? (
          <p className="text-body text-ink-600">{t("admin_em_dash")}</p>
        ) : (
          <AdminDetailContentPanel
            className={refreshing ? ADMIN_LIST_REFRESHING_SURFACE_CLASS : undefined}
            data-tt-admin-detail-refreshing={refreshing ? "1" : undefined}
          >
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
                  <div key={key} className={`${ADMIN_DETAIL_FIELD_ROW_SIMPLE_CLASS}`}>
                    <dt className="text-meta text-ink-500">{t(labelKey)}</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap break-all font-mono text-small text-ink-800 text-ink-800">
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
          </AdminDetailContentPanel>
        )}
      </section>
    </AdminDetailPageChrome>
  );
}
