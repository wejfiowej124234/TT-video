"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getAdminContentAnnouncements,
  patchAdminContentAnnouncement,
  postAdminContentAnnouncement,
  postAdminContentAnnouncementWorkflow,
} from "@/lib/apiClient";
import { invalidateCmsAnnouncementsCache } from "@/lib/cmsAnnouncementsSharedCache";
import type { CmsAnnouncementAdminRow } from "@/lib/cmsPublicAnnouncementsTypes";
import {
  CMS_CONTENT_TIERS,
  CMS_KINDS,
  CMS_OPS_LANES,
} from "@/lib/cmsPublicAnnouncementsTypes";

export type AnnouncementFormState = {
  slug: string;
  lane: string;
  kind: string;
  content_tier: string;
  pinned: boolean;
  title_zh: string;
  title_en: string;
  summary_zh: string;
  summary_en: string;
  body_zh: string;
  body_en: string;
  release_at: string;
  cta_href: string;
};

export const EMPTY_ANNOUNCEMENT_FORM: AnnouncementFormState = {
  slug: "",
  lane: "product",
  kind: "product",
  content_tier: "upcoming",
  pinned: false,
  title_zh: "",
  title_en: "",
  summary_zh: "",
  summary_en: "",
  body_zh: "",
  body_en: "",
  release_at: "2026-07-15",
  cta_href: "",
};

export function useAdminContentAnnouncementsPage() {
  const [items, setItems] = useState<CmsAnnouncementAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<AnnouncementFormState>(EMPTY_ANNOUNCEMENT_FORM);
  const [editId, setEditId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminContentAnnouncements();
      setItems(res.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "admin_content_announcements_load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  function resetForm() {
    setForm(EMPTY_ANNOUNCEMENT_FORM);
    setEditId(null);
  }

  function loadRowForEdit(row: CmsAnnouncementAdminRow) {
    if (row.publish_status === "published" || row.publish_status === "archived") return;
    setEditId(row.id);
    setForm({
      slug: row.slug,
      lane: row.lane,
      kind: row.kind,
      content_tier: row.content_tier,
      pinned: row.pinned,
      title_zh: row.title_zh,
      title_en: row.title_en,
      summary_zh: row.summary_zh,
      summary_en: row.summary_en,
      body_zh: row.body_zh ?? "",
      body_en: row.body_en ?? "",
      release_at: row.release_at ?? "",
      cta_href: row.cta_href ?? "",
    });
  }

  async function saveDraft() {
    setBusy(true);
    setError(null);
    try {
      if (editId) {
        const row = items.find((i) => i.id === editId);
        if (!row) throw new Error("not_found");
        await patchAdminContentAnnouncement(editId, {
          version: row.version,
          lane: form.lane,
          kind: form.kind,
          content_tier: form.content_tier,
          pinned: form.pinned,
          title_zh: form.title_zh,
          title_en: form.title_en,
          summary_zh: form.summary_zh,
          summary_en: form.summary_en,
          body_zh: form.body_zh || undefined,
          body_en: form.body_en || undefined,
          release_at: form.release_at || undefined,
          cta_href: form.cta_href || undefined,
        });
      } else {
        await postAdminContentAnnouncement({
          slug: form.slug.trim(),
          lane: form.lane,
          kind: form.kind,
          content_tier: form.content_tier,
          pinned: form.pinned,
          title_zh: form.title_zh,
          title_en: form.title_en,
          summary_zh: form.summary_zh,
          summary_en: form.summary_en,
          body_zh: form.body_zh || undefined,
          body_en: form.body_en || undefined,
          release_at: form.release_at || undefined,
          cta_href: form.cta_href || undefined,
        });
      }
      invalidateCmsAnnouncementsCache();
      resetForm();
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "admin_content_announcements_save_failed");
    } finally {
      setBusy(false);
    }
  }

  async function workflow(
    row: CmsAnnouncementAdminRow,
    action: "publish" | "unpublish" | "submit-review" | "archive",
  ) {
    setBusy(true);
    setError(null);
    try {
      await postAdminContentAnnouncementWorkflow(row.id, action, { version: row.version });
      invalidateCmsAnnouncementsCache();
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : `admin_content_announcements_${action}_failed`);
    } finally {
      setBusy(false);
    }
  }

  return {
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
    laneOptions: CMS_OPS_LANES,
    kindOptions: CMS_KINDS,
    tierOptions: CMS_CONTENT_TIERS,
  };
}
