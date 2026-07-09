"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getAdminContentTranslations,
  patchAdminContentTranslation,
  postAdminContentTranslation,
  postAdminContentTranslationWorkflow,
  type AdminCatalogTranslationRow,
} from "@/lib/apiClient";

export function useAdminContentTranslationPage() {
  const [items, setItems] = useState<AdminCatalogTranslationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [entityType, setEntityType] = useState("catalog_countries");
  const [entityId, setEntityId] = useState("");
  const [locale, setLocale] = useState("en");
  const [fieldKey, setFieldKey] = useState("name");
  const [value, setValue] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminContentTranslations();
      setItems(res.items ?? []);
    } catch {
      setError("admin_content_translation_load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!entityType.trim() || !entityId.trim() || !locale.trim() || !fieldKey.trim() || !value.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await postAdminContentTranslation({
        entity_type: entityType.trim(),
        entity_id: entityId.trim(),
        locale: locale.trim(),
        field_key: fieldKey.trim(),
        value: value.trim(),
      });
      setValue("");
      await reload();
    } catch {
      setError("admin_content_translation_create_failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveValue(row: AdminCatalogTranslationRow, nextValue: string) {
    setBusy(true);
    setError(null);
    try {
      await patchAdminContentTranslation(row.id, { version: row.version, value: nextValue });
      await reload();
    } catch {
      setError("admin_content_translation_patch_failed");
    } finally {
      setBusy(false);
    }
  }

  async function submitReview(row: AdminCatalogTranslationRow) {
    setBusy(true);
    setError(null);
    try {
      await postAdminContentTranslationWorkflow(row.id, "submit-review", { version: row.version });
      await reload();
    } catch {
      setError("admin_content_workflow_failed");
    } finally {
      setBusy(false);
    }
  }

  async function publish(row: AdminCatalogTranslationRow) {
    setBusy(true);
    setError(null);
    try {
      await postAdminContentTranslationWorkflow(row.id, "publish", { version: row.version });
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
    fieldKey,
    setFieldKey,
    value,
    setValue,
    handleCreate,
    saveValue,
    submitReview,
    publish,
    reload,
  };
}
