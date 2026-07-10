"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getAdminContentSeo,
  patchAdminContentSeo,
  postAdminContentSeo,
  postAdminContentSeoWorkflow,
  type AdminCatalogSeoRow,
} from "@/lib/apiClient/content/http";

export function useAdminContentSeoPage() {
  const [items, setItems] = useState<AdminCatalogSeoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [entityType, setEntityType] = useState("catalog_countries");
  const [entityId, setEntityId] = useState("");
  const [locale, setLocale] = useState("*");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminContentSeo();
      setItems(res.items ?? []);
    } catch {
      setError("admin_content_seo_load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!entityType.trim() || !entityId.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await postAdminContentSeo({
        entity_type: entityType.trim(),
        entity_id: entityId.trim(),
        locale: locale.trim() || "*",
        title: title.trim() || undefined,
        description: description.trim() || undefined,
      });
      setTitle("");
      setDescription("");
      await reload();
    } catch {
      setError("admin_content_seo_create_failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveRow(
    row: AdminCatalogSeoRow,
    patch: { title?: string; description?: string; keywords?: string; canonical_url?: string; og_image_url?: string },
  ) {
    setBusy(true);
    setError(null);
    try {
      await patchAdminContentSeo(row.id, { version: row.version, ...patch });
      await reload();
    } catch {
      setError("admin_content_seo_patch_failed");
    } finally {
      setBusy(false);
    }
  }

  async function submitReview(row: AdminCatalogSeoRow) {
    setBusy(true);
    setError(null);
    try {
      await postAdminContentSeoWorkflow(row.id, "submit-review", { version: row.version });
      await reload();
    } catch {
      setError("admin_content_workflow_failed");
    } finally {
      setBusy(false);
    }
  }

  async function publish(row: AdminCatalogSeoRow) {
    setBusy(true);
    setError(null);
    try {
      await postAdminContentSeoWorkflow(row.id, "publish", { version: row.version });
      await reload();
    } catch {
      setError("admin_content_workflow_failed");
    } finally {
      setBusy(false);
    }
  }

  return {
    items,
    loading,
    error,
    busy,
    entityType,
    setEntityType,
    entityId,
    setEntityId,
    locale,
    setLocale,
    title,
    setTitle,
    description,
    setDescription,
    handleCreate,
    saveRow,
    submitReview,
    publish,
    reload,
  };
}
