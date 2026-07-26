"use client";

import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { useAdminL5ConfirmRequest } from "@/components/admin/AdminL5ConfirmProvider";
import { AdminContentPageShell, AdminContentStatusBadge } from "@/components/admin/content/AdminContentPageShell";
import {
  adminConfirmAnnouncementPublish,
  adminConfirmAnnouncementUnpublish,
} from "@/lib/admin/adminOpsWriteConfirm";
import {
  AdminContentDataTable,
  AdminContentTableBody,
  AdminContentTableHead,
  AdminContentTableTh,
} from "@/components/admin/content/AdminContentL5Surfaces";
import { AdminOpsRiskBanner } from "@/components/admin/ops/AdminOpsRiskBanner";
import { OfficialOpsFormCard } from "@/components/admin/ops/OfficialOpsFormCard";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { canAdminMutateCmsAnnouncementLane } from "@/lib/admin/cmsAnnouncementLanePermissions";
import { contentAnnouncementVerifyHref } from "@/lib/admin/contentOpsL5";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import {
  ADMIN_FILTER_FIELD_LABEL_CLASS,
  ADMIN_FILTER_INPUT_MD_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_TABLE_TD_CELL_CLASS,
  ADMIN_TEXT_FOOTNOTE_CLASS,
  adminTableRowPrimaryActionClass,
} from "@/lib/adminUi";

import { useAdminContentAnnouncementsPage } from "./useAdminContentAnnouncementsPage";

export function AdminContentAnnouncementsPageMain() {
  const { t, locale } = useTranslation();
  const titleId = useId();
  const requestConfirm = useAdminL5ConfirmRequest();
  const caps = useAdminCapabilities();
  const hasPerm = (id: Parameters<typeof caps.hasPermission>[0]) => caps.hasPermission(id);
  const canWriteLane = (lane: string) => canAdminMutateCmsAnnouncementLane(hasPerm, lane, false);
  const canPublishLane = (lane: string) => canAdminMutateCmsAnnouncementLane(hasPerm, lane, true);
  const canAccessWrite = caps.hasPermission(ADMIN_PERM.CONTENT_WRITE);

  const {
    items,
    loading,
    error,
    busy,
    form,
    setForm,
    editId,
    resetForm,
    loadRowForEdit,
    saveDraft,
    workflow,
    reload,
    laneOptions,
    kindOptions,
    tierOptions,
  } = useAdminContentAnnouncementsPage();

  const titleCol = locale?.startsWith("zh") ? "title_zh" : "title_en";

  return (
    <AdminContentPageShell
      titleId={titleId}
      titleKey="admin_content_announcements_title"
      subtitleKey="admin_content_announcements_subtitle"
      loading={loading}
      error={error}
      onRetry={() => void reload()}
      empty={!loading && items.length === 0}
      emptyMessageKey="admin_content_announcements_empty"
    >
      <AdminOpsRiskBanner messageKey="admin_content_announcements_rust_api_banner" variant="info" />

      {canAccessWrite ? (
        <OfficialOpsFormCard
          title={t(editId ? "admin_content_announcements_edit_title" : "admin_content_announcements_create_title")}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_content_announcements_slug")}</span>
              <input
                className={ADMIN_FILTER_INPUT_MD_CLASS}
                value={form.slug}
                disabled={Boolean(editId)}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_content_announcements_lane")}</span>
              <select
                className={ADMIN_FILTER_INPUT_MD_CLASS}
                value={form.lane}
                onChange={(e) => setForm((f) => ({ ...f, lane: e.target.value }))}
              >
                {laneOptions.map((lane) => (
                  <option key={lane} value={lane}>
                    {t(`traveltrust_announcements_lane_${lane}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_content_announcements_kind")}</span>
              <select
                className={ADMIN_FILTER_INPUT_MD_CLASS}
                value={form.kind}
                onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}
              >
                {kindOptions.map((kind) => (
                  <option key={kind} value={kind}>
                    {t(`traveltrust_pulse_kind_${kind}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_content_announcements_content_tier")}</span>
              <select
                className={ADMIN_FILTER_INPUT_MD_CLASS}
                value={form.content_tier}
                onChange={(e) => setForm((f) => ({ ...f, content_tier: e.target.value }))}
              >
                {tierOptions.map((tier) => (
                  <option key={tier} value={tier}>
                    {t(`traveltrust_content_tier_${tier}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))}
              />
              <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_content_announcements_pinned")}</span>
            </label>
            <label className="block sm:col-span-2">
              <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_content_announcements_title_zh")}</span>
              <input
                className={ADMIN_FILTER_INPUT_MD_CLASS}
                value={form.title_zh}
                onChange={(e) => setForm((f) => ({ ...f, title_zh: e.target.value }))}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_content_announcements_title_en")}</span>
              <input
                className={ADMIN_FILTER_INPUT_MD_CLASS}
                value={form.title_en}
                onChange={(e) => setForm((f) => ({ ...f, title_en: e.target.value }))}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_content_announcements_summary_zh")}</span>
              <textarea
                className={ADMIN_FILTER_INPUT_MD_CLASS}
                rows={2}
                value={form.summary_zh}
                onChange={(e) => setForm((f) => ({ ...f, summary_zh: e.target.value }))}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_content_announcements_summary_en")}</span>
              <textarea
                className={ADMIN_FILTER_INPUT_MD_CLASS}
                rows={2}
                value={form.summary_en}
                onChange={(e) => setForm((f) => ({ ...f, summary_en: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_content_announcements_release_at")}</span>
              <input
                type="date"
                className={ADMIN_FILTER_INPUT_MD_CLASS}
                value={form.release_at}
                onChange={(e) => setForm((f) => ({ ...f, release_at: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_content_announcements_cta_href")}</span>
              <input
                className={ADMIN_FILTER_INPUT_MD_CLASS}
                value={form.cta_href}
                placeholder="/traveltrust"
                onChange={(e) => setForm((f) => ({ ...f, cta_href: e.target.value }))}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_content_announcements_body_zh")}</span>
              <textarea
                className={ADMIN_FILTER_INPUT_MD_CLASS}
                rows={3}
                value={form.body_zh}
                onChange={(e) => setForm((f) => ({ ...f, body_zh: e.target.value }))}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_content_announcements_body_en")}</span>
              <textarea
                className={ADMIN_FILTER_INPUT_MD_CLASS}
                rows={3}
                value={form.body_en}
                onChange={(e) => setForm((f) => ({ ...f, body_en: e.target.value }))}
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className={ADMIN_PRIMARY_ACTION_BTN_CLASS}
              disabled={busy || !canWriteLane(form.lane) || !form.slug.trim() || !form.title_zh.trim() || !form.title_en.trim()}
              onClick={() => void saveDraft()}
            >
              {t(editId ? "admin_content_announcements_update_btn" : "admin_content_announcements_create_btn")}
            </button>
            {editId ? (
              <button type="button" className={adminTableRowPrimaryActionClass()} disabled={busy} onClick={resetForm}>
                {t("admin_content_announcements_cancel_edit")}
              </button>
            ) : null}
          </div>
        </OfficialOpsFormCard>
      ) : null}

      <AdminContentDataTable className="mt-6" dataAttr="content-announcements">
        <AdminContentTableHead>
          <tr>
            <AdminContentTableTh>{t("admin_content_announcements_col_slug")}</AdminContentTableTh>
            <AdminContentTableTh>{t("admin_content_announcements_col_title")}</AdminContentTableTh>
            <AdminContentTableTh>{t("admin_content_announcements_col_lane")}</AdminContentTableTh>
            <AdminContentTableTh>{t("admin_content_col_status")}</AdminContentTableTh>
            <AdminContentTableTh>{t("admin_content_col_actions")}</AdminContentTableTh>
          </tr>
        </AdminContentTableHead>
        <AdminContentTableBody>
          {items.map((row) => (
            <tr key={row.id} data-tt-admin-content-announcement-row={row.slug}>
              <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.slug}</td>
              <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row[titleCol as "title_zh"]}</td>
              <td className={ADMIN_TABLE_TD_CELL_CLASS}>{t(`traveltrust_announcements_lane_${row.lane}`)}</td>
              <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                <AdminContentStatusBadge status={row.publish_status} />
              </td>
              <td className={`${ADMIN_TABLE_TD_CELL_CLASS} space-x-1`}>
                {canWriteLane(row.lane) && row.publish_status === "draft" ? (
                  <button
                    type="button"
                    className={adminTableRowPrimaryActionClass()}
                    disabled={busy}
                    onClick={() => loadRowForEdit(row)}
                  >
                    {t("admin_content_announcements_edit_btn")}
                  </button>
                ) : null}
                {canWriteLane(row.lane) && row.publish_status === "draft" ? (
                  <button
                    type="button"
                    className={adminTableRowPrimaryActionClass()}
                    disabled={busy}
                    onClick={() => void workflow(row, "submit-review")}
                  >
                    {t("admin_content_announcements_submit_review_btn")}
                  </button>
                ) : null}
                {canPublishLane(row.lane) && (row.publish_status === "draft" || row.publish_status === "in_review") ? (
                  <button
                    type="button"
                    className={ADMIN_PRIMARY_ACTION_BTN_CLASS}
                    disabled={busy}
                    onClick={() =>
                      requestConfirm(
                        adminConfirmAnnouncementPublish(() => void workflow(row, "publish")),
                      )
                    }
                  >
                    {t("admin_content_announcements_publish_btn")}
                  </button>
                ) : null}
                {row.publish_status === "published" ? (
                  (() => {
                    const verifyHref = contentAnnouncementVerifyHref(row);
                    return verifyHref ? (
                      <Link
                        href={verifyHref}
                        className={`${adminTableRowPrimaryActionClass()} mr-2 inline-flex`}
                        data-tt-admin-content-verify-cta="1"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t("admin_content_action_verify")}
                      </Link>
                    ) : (
                      <span
                        className={`mr-2 text-meta ${ADMIN_TEXT_FOOTNOTE_CLASS}`}
                        data-tt-admin-content-verify-unavailable="1"
                      >
                        {t("admin_content_action_verify_unavailable")}
                      </span>
                    );
                  })()
                ) : null}
                {canWriteLane(row.lane) && row.publish_status === "published" ? (
                  <button
                    type="button"
                    className={adminTableRowPrimaryActionClass()}
                    disabled={busy}
                    onClick={() =>
                      requestConfirm(
                        adminConfirmAnnouncementUnpublish(() => void workflow(row, "unpublish")),
                      )
                    }
                  >
                    {t("admin_content_announcements_unpublish_btn")}
                  </button>
                ) : null}
                {canWriteLane(row.lane) && row.publish_status !== "archived" ? (
                  <button
                    type="button"
                    className={adminTableRowPrimaryActionClass()}
                    disabled={busy}
                    onClick={() => void workflow(row, "archive")}
                  >
                    {t("admin_content_announcements_archive_btn")}
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </AdminContentTableBody>
      </AdminContentDataTable>
    </AdminContentPageShell>
  );
}
