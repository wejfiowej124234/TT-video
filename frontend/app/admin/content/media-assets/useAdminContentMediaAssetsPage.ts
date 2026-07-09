"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getAdminContentMediaAssets,
  patchAdminContentMediaAsset,
  postAdminContentMediaAsset,
  postAdminContentMediaAssetWorkflow,
  type AdminCatalogMediaAssetRow,
} from "@/lib/apiClient";

export function useAdminContentMediaAssetsPage(assetKind?: string) {
  const [items, setItems] = useState<AdminCatalogMediaAssetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [assetKindInput, setAssetKindInput] = useState("landing_ambient");
  const [sourceType, setSourceType] = useState("url");
  const [url, setUrl] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminContentMediaAssets(assetKind ? { asset_kind: assetKind } : undefined);
      setItems(res.items ?? []);
    } catch {
      setError("admin_content_media_assets_load_failed");
    } finally {
      setLoading(false);
    }
  }, [assetKind]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!assetKindInput.trim() || !sourceType.trim() || !url.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await postAdminContentMediaAsset({
        asset_kind: assetKindInput.trim(),
        source_type: sourceType.trim(),
        url: url.trim(),
      });
      setUrl("");
      await reload();
    } catch {
      setError("admin_content_media_assets_create_failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveUrl(row: AdminCatalogMediaAssetRow, nextUrl: string) {
    setBusy(true);
    setError(null);
    try {
      await patchAdminContentMediaAsset(row.id, { version: row.version, url: nextUrl });
      await reload();
    } catch {
      setError("admin_content_media_assets_patch_failed");
    } finally {
      setBusy(false);
    }
  }

  async function submitReview(row: AdminCatalogMediaAssetRow) {
    setBusy(true);
    setError(null);
    try {
      await postAdminContentMediaAssetWorkflow(row.id, "submit-review", { version: row.version });
      await reload();
    } catch {
      setError("admin_content_workflow_failed");
    } finally {
      setBusy(false);
    }
  }

  async function publish(row: AdminCatalogMediaAssetRow) {
    setBusy(true);
    setError(null);
    try {
      await postAdminContentMediaAssetWorkflow(row.id, "publish", { version: row.version });
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
    assetKindInput,
    setAssetKindInput,
    sourceType,
    setSourceType,
    url,
    setUrl,
    handleCreate,
    saveUrl,
    submitReview,
    publish,
    reload,
  };
}
