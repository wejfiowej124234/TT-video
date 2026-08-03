"use client";

import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { AdminOpsPlanePermissionBanners } from "@/components/admin/ops/AdminOpsPlanePermissionBanners";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import {
  ADMIN_CONSOLE_JSON_BLOCK_CLASS,
  ADMIN_DETAIL_SECTION_TITLE_CLASS,
  adminTableRowPrimaryActionClass,
} from "@/lib/adminUi";

import { useAdminBackupPage } from "./useAdminBackupPage";

export function AdminBackupPageMain() {
  const { t } = useTranslation();
  const titleId = useId();
  const { body, loading, error, reload } = useAdminBackupPage();
  const baseline = body?.baseline ?? {};
  const status = typeof baseline.status === "string" ? baseline.status : "PLANNED";

  return (
    <AdminListPageChrome
      titleId={titleId}
      title={t("admin_backup_title")}
      subtitle={t("admin_backup_subtitle")}
      mainDataAttrs={{ "data-tt-admin-backup-page": "1" }}
    >
      <AdminOpsPlanePermissionBanners read={ADMIN_PERM.PLATFORM_READ} />
      <p className="text-small text-ink-600">{t("admin_backup_readonly_note")}</p>
      <button
        type="button"
        className={`mt-3 ${adminTableRowPrimaryActionClass()}`}
        onClick={() => void reload()}
        data-tt-admin-backup-refresh="1"
      >
        {t("admin_backup_refresh")}
      </button>
      {loading && !body ? (
        <AdminListLoadingStatus message={t("admin_loading")} className="mt-4 text-body text-ink-600" />
      ) : error && !body ? (
        <AdminListFetchError errorKind="failed" message={t(error)} className="mt-4" />
      ) : body ? (
        <div className="mt-6 space-y-6" data-tt-admin-backup-status="1">
          <section>
            <h2 className={ADMIN_DETAIL_SECTION_TITLE_CLASS}>{t("admin_backup_status_heading")}</h2>
            <p className="mt-2 text-body">
              <span
                className="rounded-md border border-ink-300 px-2 py-1 font-mono text-small"
                data-tt-admin-backup-baseline-status={status}
              >
                {status}
              </span>
            </p>
            {body.baseline_file_found === false ? (
              <p className="mt-2 text-small text-amber-800">{t("admin_backup_baseline_missing")}</p>
            ) : null}
          </section>
          <section>
            <h2 className={ADMIN_DETAIL_SECTION_TITLE_CLASS}>{t("admin_backup_rpo_rto_heading")}</h2>
            <p className="mt-2 text-small text-ink-700">{t("admin_backup_rpo_rto_body")}</p>
          </section>
          <section>
            <h2 className={ADMIN_DETAIL_SECTION_TITLE_CLASS}>{t("admin_backup_runbooks_heading")}</h2>
            {(body.runbooks ?? []).length === 0 ? (
              <AdminListPageEmptyState messageKey="admin_list_empty_backup_runbooks" nextLinks={[]} />
            ) : (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-small text-ink-700">
                {(body.runbooks ?? []).map((rb) => (
                  <li key={rb.id}>
                    <span className="font-mono">{rb.id}</span>
                    <span className="text-ink-500"> — {rb.path}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h2 className={ADMIN_DETAIL_SECTION_TITLE_CLASS}>{t("admin_backup_baseline_json_heading")}</h2>
            <pre className={`mt-2 max-h-96 overflow-auto ${ADMIN_CONSOLE_JSON_BLOCK_CLASS}`}>
              {JSON.stringify(baseline, null, 2)}
            </pre>
          </section>
        </div>
      ) : (
        <AdminListPageEmptyState messageKey="admin_list_empty_backup" nextLinks={[]} />
      )}
    </AdminListPageChrome>
  );
}
