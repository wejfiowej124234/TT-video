"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getAdminContentCountries,
  patchAdminContentCountry,
  postAdminContentCountry,
  postAdminContentCountryWorkflow,
  type AdminCatalogCountryRow,
} from "@/lib/apiClient";

export function useAdminContentCountriesPage() {
  const [items, setItems] = useState<AdminCatalogCountryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [iso3166, setIso3166] = useState("");
  const [nameZh, setNameZh] = useState("");
  const [nameEn, setNameEn] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminContentCountries();
      setItems(res.items ?? []);
    } catch {
      setError("admin_content_countries_load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!iso3166.trim() || !nameZh.trim() || !nameEn.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await postAdminContentCountry({
        iso3166: iso3166.trim(),
        name_zh: nameZh.trim(),
        name_en: nameEn.trim(),
      });
      setIso3166("");
      setNameZh("");
      setNameEn("");
      await reload();
    } catch {
      setError("admin_content_countries_create_failed");
    } finally {
      setBusy(false);
    }
  }

  async function submitReview(row: AdminCatalogCountryRow) {
    setBusy(true);
    setError(null);
    try {
      await postAdminContentCountryWorkflow(row.id, "submit-review", { version: row.version });
      await reload();
    } catch {
      setError("admin_content_workflow_failed");
    } finally {
      setBusy(false);
    }
  }

  async function publish(row: AdminCatalogCountryRow) {
    setBusy(true);
    setError(null);
    try {
      await postAdminContentCountryWorkflow(row.id, "publish", { version: row.version });
      await reload();
    } catch {
      setError("admin_content_workflow_failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveRow(row: AdminCatalogCountryRow, name_zh: string, name_en: string) {
    setBusy(true);
    setError(null);
    try {
      await patchAdminContentCountry(row.id, { version: row.version, name_zh, name_en });
      await reload();
    } catch {
      setError("admin_content_countries_patch_failed");
    } finally {
      setBusy(false);
    }
  }

  return {
    items,
    loading,
    error,
    busy,
    iso3166,
    setIso3166,
    nameZh,
    setNameZh,
    nameEn,
    setNameEn,
    handleCreate,
    submitReview,
    publish,
    saveRow,
  };
}
