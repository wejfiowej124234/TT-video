"use client";

import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { useAdminL5ConfirmRequest } from "@/components/admin/AdminL5ConfirmProvider";
import { AdminContentPageShell, AdminContentStatusBadge } from "@/components/admin/content/AdminContentPageShell";
import {
  AdminContentDataTable,
  AdminContentTableBody,
  AdminContentTableHead,
  AdminContentTableTh,
} from "@/components/admin/content/AdminContentL5Surfaces";
import { AdminOpsRiskBanner } from "@/components/admin/ops/AdminOpsRiskBanner";
import { adminCatalogPublishQueueAdminPath } from "@/lib/admin/adminCatalogPublishQueueNav";
import { adminConfirmCatalogPublish } from "@/lib/admin/adminOpsWriteConfirm";
import { ADMIN_TABLE_TD_CELL_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";

import { useAdminContentPublishQueuePage } from "./useAdminContentPublishQueuePage";

export function AdminContentPublishQueuePageMain() {
  const { t } = useTranslation();
  const titleId = useId();
  const requestConfirm = useAdminL5ConfirmRequest();
  const { items, loading, error, busy, publishRow } = useAdminContentPublishQueuePage();

  return (
    <AdminContentPageShell
      titleId={titleId}
      titleKey="admin_content_publish_queue_title"
      subtitleKey="admin_content_publish_queue_subtitle"
      loading={loading}
      error={error}
    >
      <AdminOpsRiskBanner messageKey="admin_ops_risk_banner_catalog_publish" />
      <p className="mb-4 text-body-s text-ink-600">{t("admin_content_publish_queue_ops_note")}</p>

      <div data-tt-admin-content-publish-queue="1">
        <AdminContentDataTable dataAttr="content-publish-queue">
          <AdminContentTableHead>
            <tr>
              <AdminContentTableTh>{t("admin_content_col_entity")}</AdminContentTableTh>
              <AdminContentTableTh>{t("admin_content_col_label")}</AdminContentTableTh>
              <AdminContentTableTh>{t("admin_content_col_status")}</AdminContentTableTh>
              <AdminContentTableTh>{t("admin_content_col_version")}</AdminContentTableTh>
              <AdminContentTableTh>{t("admin_content_col_actions")}</AdminContentTableTh>
            </tr>
          </AdminContentTableHead>
          <AdminContentTableBody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className={`${ADMIN_TABLE_TD_CELL_CLASS} text-ink-500`}>
                  {t("admin_content_publish_queue_empty")}
                </td>
              </tr>
            ) : (
              items.map((row) => {
                const modulePath = adminCatalogPublishQueueAdminPath(row.entity_type);
                return (
                  <tr key={`${row.entity_type}-${row.entity_id}`}>
                    <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.entity_type}</td>
                    <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.label}</td>
                    <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                      <AdminContentStatusBadge status={row.publish_status} />
                    </td>
                    <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.version}</td>
                    <td className={`${ADMIN_TABLE_TD_CELL_CLASS} space-x-2`}>
                      {modulePath ? (
                        <Link
                          href={modulePath}
                          className={adminPageNavLinkClass()}
                          data-tt-admin-content-publish-queue-open="1"
                        >
                          {t("admin_content_publish_queue_open_module")}
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        disabled={busy}
                        className="underline"
                        data-tt-admin-content-publish-queue-publish="1"
                        onClick={() =>
                          requestConfirm(adminConfirmCatalogPublish(() => publishRow(row)))
                        }
                      >
                        {t("admin_content_action_publish")}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </AdminContentTableBody>
        </AdminContentDataTable>
      </div>
    </AdminContentPageShell>
  );
}
