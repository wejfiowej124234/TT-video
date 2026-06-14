"use client";

import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminContentPageShell, AdminContentStatusBadge } from "@/components/admin/content/AdminContentPageShell";
import { AdminContentPanelCard } from "@/components/admin/content/AdminContentL5Surfaces";
import {
  OfficialOpsFilterBar,
  adminTableRowPrimaryActionClass,
  adminTableRowSecondaryActionClass,
} from "@/components/admin/ops/OfficialOpsFilterBar";

import { useAdminContentPoiImageBatchPage } from "./useAdminContentPoiImageBatchPage";

export function AdminContentPoiImageBatchPageMain() {
  const { t } = useTranslation();
  const titleId = useId();
  const {
    batch,
    grouped,
    loading,
    error,
    actionError,
    selectCandidate,
    reviewCandidate,
    runWorkflow,
  } = useAdminContentPoiImageBatchPage();

  return (
    <AdminContentPageShell
      titleId={titleId}
      titleKey="admin_content_poi_image_batch_title"
      subtitleKey="admin_content_poi_image_batch_subtitle"
      loading={loading}
      error={error ?? actionError}
    >
      {batch ? (
        <div data-tt-admin-content-poi-image-batch="1">
          <OfficialOpsFilterBar dataAttr="poi-image-batch-meta">
            <Link href="/admin/content/poi-images" className="text-brand-600 hover:underline">
              {t("admin_content_poi_images_back")}
            </Link>
            <span>{batch.batch_name}</span>
            <AdminContentStatusBadge status={batch.status} />
            <span>
              {t("admin_content_poi_images_col_coverage")}: {batch.approved_count}/{batch.poi_count}
            </span>
            <span>
              {t("admin_content_col_version")}: {batch.version}
            </span>
          </OfficialOpsFilterBar>
          <div className="mb-6 flex flex-wrap gap-2">
            {batch.status === "draft" || batch.status === "generating" ? (
              <button
                type="button"
                className={adminTableRowPrimaryActionClass()}
                onClick={() => void runWorkflow("submit-review")}
              >
                {t("admin_content_poi_image_submit_review")}
              </button>
            ) : null}
            {batch.status === "review" ? (
              <>
                <button
                  type="button"
                  className={adminTableRowPrimaryActionClass()}
                  onClick={() => void runWorkflow("request-publish")}
                >
                  {t("admin_content_poi_image_request_publish")}
                </button>
                <button
                  type="button"
                  className={adminTableRowSecondaryActionClass()}
                  onClick={() => void runWorkflow("publish")}
                >
                  {t("admin_content_poi_image_publish")}
                </button>
              </>
            ) : null}
          </div>
          <div className="space-y-6">
            {grouped.map((group) => (
              <AdminContentPanelCard key={group.poiId} title={group.poiName} dataAttr="poi-image-group">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {group.rows.map((c) => (
                    <div
                      key={c.id}
                      className="rounded border border-ink-100 p-2"
                      data-tt-poi-image-candidate={c.id}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.candidate_url}
                        alt={c.scene_description ?? group.poiName}
                        className="mb-2 h-32 w-full object-cover"
                      />
                      <p className="mb-1 text-body-xs text-ink-600">{c.scene_description ?? "—"}</p>
                      <AdminContentStatusBadge status={c.review_status} />
                      <div className="mt-2 flex flex-wrap gap-1">
                        <button
                          type="button"
                          className="rounded bg-ink-100 px-2 py-0.5 text-body-xs"
                          onClick={() => void selectCandidate(group.poiId, c.id)}
                        >
                          {t("admin_content_poi_image_select")}
                        </button>
                        <button
                          type="button"
                          className="rounded bg-green-50 px-2 py-0.5 text-body-xs text-green-800"
                          onClick={() => void reviewCandidate(c.id, "approved")}
                        >
                          {t("admin_content_poi_image_approve")}
                        </button>
                        <button
                          type="button"
                          className="rounded bg-red-50 px-2 py-0.5 text-body-xs text-red-800"
                          onClick={() => void reviewCandidate(c.id, "rejected")}
                        >
                          {t("admin_content_poi_image_reject")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </AdminContentPanelCard>
            ))}
          </div>
        </div>
      ) : null}
    </AdminContentPageShell>
  );
}
