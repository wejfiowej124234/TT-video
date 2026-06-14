"use client";



import { useId, useState } from "react";



import { useTranslation } from "@/components/LocaleProvider";

import { AdminContentPageShell } from "@/components/admin/content/AdminContentPageShell";

import {

  AdminContentDataTable,

  AdminContentTableBody,

  AdminContentTableHead,

  AdminContentTableTh,

} from "@/components/admin/content/AdminContentL5Surfaces";

import { postAdminContentImportTrigger } from "@/lib/apiClient";

import { ADMIN_TABLE_TD_CELL_CLASS } from "@/lib/adminUi";



import { useAdminContentImportOperationsPage } from "./useAdminContentImportOperationsPage";



export function AdminContentImportOperationsPageMain() {

  const { t } = useTranslation();

  const titleId = useId();

  const { imports, rollbacks, loading, error, reload } = useAdminContentImportOperationsPage();

  const [triggerMsg, setTriggerMsg] = useState<string | null>(null);



  async function onTrigger(mode: "validate" | "dry-run") {

    setTriggerMsg(null);

    try {

      const res = await postAdminContentImportTrigger({ mode, skip_m6: false });

      setTriggerMsg(res.approval_request_id ?? "ok");

      await reload();

    } catch {

      setTriggerMsg("fail");

    }

  }



  return (

    <AdminContentPageShell

      titleId={titleId}

      titleKey="admin_content_import_ops_title"

      subtitleKey="admin_content_import_ops_subtitle"

      loading={loading}

      error={error}

    >

      <div data-tt-admin-content-import-operations="1">

        <div className="mb-6 flex flex-wrap gap-2">

          <button

            type="button"

            className="rounded bg-brand-600 px-3 py-1 text-body-s text-white"

            onClick={() => void onTrigger("validate")}

          >

            {t("admin_content_import_trigger_validate")}

          </button>

          <button

            type="button"

            className="rounded border border-ink-300 px-3 py-1 text-body-s"

            onClick={() => void onTrigger("dry-run")}

          >

            {t("admin_content_import_trigger_dry_run")}

          </button>

          {triggerMsg ? (

            <span className="text-body-s text-ink-600">{t("admin_content_import_trigger_result")}: {triggerMsg}</span>

          ) : null}

        </div>

        <h3 className="mb-2 text-body-m font-medium">{t("admin_content_import_history_title")}</h3>

        <AdminContentDataTable dataAttr="content-import-history" className="mb-6 mt-0">

          <AdminContentTableHead>

            <tr>

              <AdminContentTableTh>{t("admin_content_col_batch")}</AdminContentTableTh>

              <AdminContentTableTh>{t("admin_content_col_rows")}</AdminContentTableTh>

              <AdminContentTableTh>{t("admin_content_col_last_seen")}</AdminContentTableTh>

            </tr>

          </AdminContentTableHead>

          <AdminContentTableBody>

            {imports.map((row) => (

              <tr key={row.import_batch_id}>

                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.import_batch_id.slice(0, 8)}…</td>

                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.row_count}</td>

                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.last_seen ?? "—"}</td>

              </tr>

            ))}

          </AdminContentTableBody>

        </AdminContentDataTable>

        <h3 className="mb-2 text-body-m font-medium">{t("admin_content_rollback_history_title")}</h3>

        <div data-tt-admin-content-rollback-history="1">

          <AdminContentDataTable dataAttr="content-rollback-history" className="mt-0">

            <AdminContentTableHead>

              <tr>

                <AdminContentTableTh>{t("admin_content_col_entity")}</AdminContentTableTh>

                <AdminContentTableTh>{t("admin_content_col_version")}</AdminContentTableTh>

                <AdminContentTableTh>{t("admin_content_col_created")}</AdminContentTableTh>

              </tr>

            </AdminContentTableHead>

            <AdminContentTableBody>

              {rollbacks.map((row) => (

                <tr key={row.id}>

                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.entity_type}</td>

                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.version}</td>

                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.created_at ?? "—"}</td>

                </tr>

              ))}

            </AdminContentTableBody>

          </AdminContentDataTable>

        </div>

      </div>

    </AdminContentPageShell>

  );

}


