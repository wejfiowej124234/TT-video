"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getAdminRoadmapMilestones,
  getAdminRoadmapSection,
  patchAdminRoadmapMilestone,
  patchAdminRoadmapSection,
  postAdminRoadmapMilestone,
  postAdminRoadmapMilestoneWorkflow,
  postAdminRoadmapSectionWorkflow,
} from "@/lib/apiClient";
import type { CmsRoadmapMilestoneAdmin, CmsRoadmapSectionAdmin } from "@/lib/cmsRoadmapTypes";
import { CMS_ROADMAP_KINDS, CMS_ROADMAP_OPS_STATUSES } from "@/lib/cmsRoadmapTypes";

export type RoadmapSectionFormState = {
  anchor_id: string;
  period_label: string;
  kicker_zh: string;
  kicker_en: string;
  title_zh: string;
  title_en: string;
  subtitle_zh: string;
  subtitle_en: string;
  disclaimer_zh: string;
  disclaimer_en: string;
};

export type RoadmapMilestoneFormState = {
  slug: string;
  kind: string;
  sort_order: number;
  ops_status: string;
  title_zh: string;
  title_en: string;
  summary_zh: string;
  summary_en: string;
  cta_href: string;
};

export const EMPTY_MILESTONE_FORM: RoadmapMilestoneFormState = {
  slug: "",
  kind: "product",
  sort_order: 10,
  ops_status: "planned",
  title_zh: "",
  title_en: "",
  summary_zh: "",
  summary_en: "",
  cta_href: "",
};

const EMPTY_SECTION: RoadmapSectionFormState = {
  anchor_id: "product-roadmap",
  period_label: "2026",
  kicker_zh: "",
  kicker_en: "",
  title_zh: "",
  title_en: "",
  subtitle_zh: "",
  subtitle_en: "",
  disclaimer_zh: "",
  disclaimer_en: "",
};

function sectionToForm(section: CmsRoadmapSectionAdmin): RoadmapSectionFormState {
  return {
    anchor_id: section.anchor_id,
    period_label: section.period_label,
    kicker_zh: section.kicker_zh,
    kicker_en: section.kicker_en,
    title_zh: section.title_zh,
    title_en: section.title_en,
    subtitle_zh: section.subtitle_zh,
    subtitle_en: section.subtitle_en,
    disclaimer_zh: section.disclaimer_zh,
    disclaimer_en: section.disclaimer_en,
  };
}

export function useAdminContentRoadmapPage() {
  const [section, setSection] = useState<CmsRoadmapSectionAdmin | null>(null);
  const [sectionForm, setSectionForm] = useState<RoadmapSectionFormState>(EMPTY_SECTION);
  const [items, setItems] = useState<CmsRoadmapMilestoneAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState<RoadmapMilestoneFormState>(EMPTY_MILESTONE_FORM);
  const [editMilestoneId, setEditMilestoneId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sectionRes, itemsRes] = await Promise.all([
        getAdminRoadmapSection(),
        getAdminRoadmapMilestones(),
      ]);
      const sec = sectionRes.section ?? null;
      setSection(sec);
      if (sec) setSectionForm(sectionToForm(sec));
      setItems(itemsRes.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "admin_content_roadmap_load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function saveSectionDraft() {
    if (!section) return;
    setBusy(true);
    setError(null);
    try {
      const res = await patchAdminRoadmapSection({
        version: section.version,
        ...sectionForm,
      });
      if (res.section) {
        setSection(res.section);
        setSectionForm(sectionToForm(res.section));
      }
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "save_failed");
    } finally {
      setBusy(false);
    }
  }

  async function sectionWorkflow(action: "submit-review" | "publish" | "unpublish") {
    if (!section) return;
    setBusy(true);
    setError(null);
    try {
      await postAdminRoadmapSectionWorkflow(action, { version: section.version });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "workflow_failed");
    } finally {
      setBusy(false);
    }
  }

  function resetMilestoneForm() {
    setMilestoneForm(EMPTY_MILESTONE_FORM);
    setEditMilestoneId(null);
  }

  function loadMilestoneForEdit(row: CmsRoadmapMilestoneAdmin) {
    setEditMilestoneId(row.id);
    setMilestoneForm({
      slug: row.slug,
      kind: row.kind,
      sort_order: row.sort_order,
      ops_status: row.ops_status ?? "planned",
      title_zh: row.title_zh,
      title_en: row.title_en,
      summary_zh: row.summary_zh,
      summary_en: row.summary_en,
      cta_href: row.cta_href ?? "",
    });
  }

  async function saveMilestoneDraft() {
    setBusy(true);
    setError(null);
    try {
      if (editMilestoneId) {
        const row = items.find((i) => i.id === editMilestoneId);
        if (!row) throw new Error("not_found");
        await patchAdminRoadmapMilestone(editMilestoneId, {
          version: row.version,
          kind: milestoneForm.kind,
          sort_order: milestoneForm.sort_order,
          ops_status: milestoneForm.ops_status as "planned" | "in_progress" | "completed",
          title_zh: milestoneForm.title_zh,
          title_en: milestoneForm.title_en,
          summary_zh: milestoneForm.summary_zh,
          summary_en: milestoneForm.summary_en,
          cta_href: milestoneForm.cta_href || undefined,
        });
      } else {
        await postAdminRoadmapMilestone({
          slug: milestoneForm.slug,
          kind: milestoneForm.kind,
          sort_order: milestoneForm.sort_order,
          ops_status: milestoneForm.ops_status as "planned" | "in_progress" | "completed",
          title_zh: milestoneForm.title_zh,
          title_en: milestoneForm.title_en,
          summary_zh: milestoneForm.summary_zh,
          summary_en: milestoneForm.summary_en,
          cta_href: milestoneForm.cta_href || undefined,
          cta_kind: "learn_more",
        });
      }
      resetMilestoneForm();
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "save_failed");
    } finally {
      setBusy(false);
    }
  }

  async function milestoneWorkflow(
    id: string,
    action: "submit-review" | "publish" | "unpublish" | "archive",
  ) {
    const row = items.find((i) => i.id === id);
    if (!row) return;
    setBusy(true);
    setError(null);
    try {
      await postAdminRoadmapMilestoneWorkflow(id, action, { version: row.version });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "workflow_failed");
    } finally {
      setBusy(false);
    }
  }

  return {
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
    kindOptions: CMS_ROADMAP_KINDS,
    opsStatusOptions: CMS_ROADMAP_OPS_STATUSES,
  };
}
