"use client";

import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminContentPageShell, AdminContentStatusBadge } from "@/components/admin/content/AdminContentPageShell";
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
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import {
  ADMIN_FILTER_FIELD_LABEL_CLASS,
  ADMIN_FILTER_INPUT_MD_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_TABLE_TD_CELL_CLASS,
  adminTableRowPrimaryActionClass,
} from "@/lib/adminUi";

import { useAdminContentRoadmapPage } from "./useAdminContentRoadmapPage";

export function AdminContentRoadmapPageMain() {
  const { t, locale } = useTranslation();
  const titleId = useId();
  const caps = useAdminCapabilities();
  const hasPerm = (id: Parameters<typeof caps.hasPermission>[0]) => caps.hasPermission(id);
  const canWrite = canAdminMutateCmsAnnouncementLane(hasPerm, "roadmap", false);
  const canPublish = canAdminMutateCmsAnnouncementLane(hasPerm, "roadmap", true);
  const titleCol = locale?.startsWith("zh") ? "title_zh" : "title_en";

  const {
    section,
    sectionForm,
    setSectionForm,
    items,
    loading,
    error,
    busy,
    milestoneForm,
    setMilestoneForm,
    editMilestoneId,
    resetMilestoneForm,
    loadMilestoneForEdit,
    saveSectionDraft,
    sectionWorkflow,
    saveMilestoneDraft,
    milestoneWorkflow,
    reload,
    kindOptions,
    opsStatusOptions,
  } = useAdminContentRoadmapPage();

  return (
    <AdminContentPageShell
      titleId={titleId}
      titleKey="admin_content_roadmap_title"
      subtitleKey="admin_content_roadmap_subtitle"
      loading={loading}
      error={error}
      onRetry={() => void reload()}
      empty={false}
    >
      <AdminOpsRiskBanner messageKey="admin_content_roadmap_rust_api_banner" variant="info" />

      {section ? (
        <OfficialOpsFormCard title={t("admin_content_roadmap_section_title")}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <AdminContentStatusBadge status={section.publish_status} />
            <span className="text-xs text-muted-foreground">v{section.version}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_content_roadmap_period_label")}</span>
              <input
                className={ADMIN_FILTER_INPUT_MD_CLASS}
                value={sectionForm.period_label}
                disabled={!canWrite || section.publish_status === "published"}
                onChange={(e) => setSectionForm((f) => ({ ...f, period_label: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_content_roadmap_anchor_id")}</span>
              <input
                className={ADMIN_FILTER_INPUT_MD_CLASS}
                value={sectionForm.anchor_id}
                disabled={!canWrite || section.publish_status === "published"}
                onChange={(e) => setSectionForm((f) => ({ ...f, anchor_id: e.target.value }))}
              />
            </label>
            {(["kicker", "title", "subtitle", "disclaimer"] as const).flatMap((field) =>
              (["zh", "en"] as const).map((lang) => (
                <label key={`${field}_${lang}`} className="block sm:col-span-2">
                  <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
                    {t(`admin_content_roadmap_${field}_${lang}`)}
                  </span>
                  <input
                    className={ADMIN_FILTER_INPUT_MD_CLASS}
                    value={sectionForm[`${field}_${lang}` as keyof typeof sectionForm] as string}
                    disabled={!canWrite || section.publish_status === "published"}
                    onChange={(e) =>
                      setSectionForm((f) => ({ ...f, [`${field}_${lang}`]: e.target.value }))
                    }
                  />
                </label>
              )),
            )}
          </div>
          {canWrite && section.publish_status !== "published" ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className={ADMIN_PRIMARY_ACTION_BTN_CLASS} disabled={busy} onClick={() => void saveSectionDraft()}>
                {t("admin_content_roadmap_save_draft")}
              </button>
              <button type="button" className={adminTableRowPrimaryActionClass()} disabled={busy} onClick={() => void sectionWorkflow("submit-review")}>
                {t("admin_content_announcements_submit_review_btn")}
              </button>
            </div>
          ) : null}
          {canPublish && section.publish_status === "in_review" ? (
            <button type="button" className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS} mt-2`} disabled={busy} onClick={() => void sectionWorkflow("publish")}>
              {t("admin_content_announcements_publish_btn")}
            </button>
          ) : null}
        </OfficialOpsFormCard>
      ) : null}

      {canWrite ? (
        <OfficialOpsFormCard title={t(editMilestoneId ? "admin_content_roadmap_edit_milestone" : "admin_content_roadmap_create_milestone")}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_content_announcements_slug")}</span>
              <input className={ADMIN_FILTER_INPUT_MD_CLASS} value={milestoneForm.slug} disabled={Boolean(editMilestoneId)} onChange={(e) => setMilestoneForm((f) => ({ ...f, slug: e.target.value }))} />
            </label>
            <label className="block">
              <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_content_roadmap_ops_status")}</span>
              <select className={ADMIN_FILTER_INPUT_MD_CLASS} value={milestoneForm.ops_status} onChange={(e) => setMilestoneForm((f) => ({ ...f, ops_status: e.target.value }))}>
                {opsStatusOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_content_announcements_kind")}</span>
              <select className={ADMIN_FILTER_INPUT_MD_CLASS} value={milestoneForm.kind} onChange={(e) => setMilestoneForm((f) => ({ ...f, kind: e.target.value }))}>
                {kindOptions.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_content_roadmap_sort_order")}</span>
              <input type="number" className={ADMIN_FILTER_INPUT_MD_CLASS} value={milestoneForm.sort_order} onChange={(e) => setMilestoneForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} />
            </label>
            <label className="block">
              <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_content_announcements_title_zh")}</span>
              <input className={ADMIN_FILTER_INPUT_MD_CLASS} value={milestoneForm.title_zh} onChange={(e) => setMilestoneForm((f) => ({ ...f, title_zh: e.target.value }))} />
            </label>
            <label className="block">
              <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_content_announcements_title_en")}</span>
              <input className={ADMIN_FILTER_INPUT_MD_CLASS} value={milestoneForm.title_en} onChange={(e) => setMilestoneForm((f) => ({ ...f, title_en: e.target.value }))} />
            </label>
            <label className="block sm:col-span-2">
              <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_content_announcements_summary_zh")}</span>
              <textarea className={ADMIN_FILTER_INPUT_MD_CLASS} rows={2} value={milestoneForm.summary_zh} onChange={(e) => setMilestoneForm((f) => ({ ...f, summary_zh: e.target.value }))} />
            </label>
            <label className="block sm:col-span-2">
              <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_content_announcements_summary_en")}</span>
              <textarea className={ADMIN_FILTER_INPUT_MD_CLASS} rows={2} value={milestoneForm.summary_en} onChange={(e) => setMilestoneForm((f) => ({ ...f, summary_en: e.target.value }))} />
            </label>
            <label className="block sm:col-span-2">
              <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_content_announcements_cta_href")}</span>
              <input className={ADMIN_FILTER_INPUT_MD_CLASS} value={milestoneForm.cta_href} onChange={(e) => setMilestoneForm((f) => ({ ...f, cta_href: e.target.value }))} />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className={ADMIN_PRIMARY_ACTION_BTN_CLASS} disabled={busy} onClick={() => void saveMilestoneDraft()}>
              {t("admin_content_roadmap_save_draft")}
            </button>
            {editMilestoneId ? (
              <button type="button" className={adminTableRowPrimaryActionClass()} disabled={busy} onClick={resetMilestoneForm}>
                {t("admin_content_announcements_cancel_edit")}
              </button>
            ) : null}
          </div>
        </OfficialOpsFormCard>
      ) : null}

      <AdminContentDataTable className="mt-6" dataAttr="content-roadmap">
        <AdminContentTableHead>
          <AdminContentTableTh>{t("admin_content_announcements_slug")}</AdminContentTableTh>
          <AdminContentTableTh>{t("admin_content_announcements_col_title")}</AdminContentTableTh>
          <AdminContentTableTh>{t("admin_content_roadmap_ops_status")}</AdminContentTableTh>
          <AdminContentTableTh>{t("admin_content_roadmap_col_status")}</AdminContentTableTh>
        </AdminContentTableHead>
        <AdminContentTableBody>
          {items.map((row) => (
            <tr key={row.id}>
              <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.slug}</td>
              <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row[titleCol as "title_zh" | "title_en"]}</td>
              <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.ops_status ?? "planned"}</td>
              <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                <AdminContentStatusBadge status={row.publish_status} />
              </td>
              <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                <div className="flex flex-wrap gap-2">
                  {canWrite && row.publish_status !== "published" ? (
                    <button type="button" className={adminTableRowPrimaryActionClass()} onClick={() => loadMilestoneForEdit(row)}>
                      {t("admin_content_announcements_edit_btn")}
                    </button>
                  ) : null}
                  {canWrite && row.publish_status === "draft" ? (
                    <button type="button" className={adminTableRowPrimaryActionClass()} disabled={busy} onClick={() => void milestoneWorkflow(row.id, "submit-review")}>
                      {t("admin_content_announcements_submit_review_btn")}
                    </button>
                  ) : null}
                  {canPublish && row.publish_status === "in_review" ? (
                    <button type="button" className={adminTableRowPrimaryActionClass()} disabled={busy} onClick={() => void milestoneWorkflow(row.id, "publish")}>
                      {t("admin_content_announcements_publish_btn")}
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </AdminContentTableBody>
      </AdminContentDataTable>
    </AdminContentPageShell>
  );
}
