"use client";

import { useCallback, useEffect, useState } from "react";

import { getAdminContentMediaAssets, type AdminCatalogMediaAssetRow } from "@/lib/apiClient";

export function useAdminContentMediaAssetsPage(assetKind?: string) {
  const [items, setItems] = useState<AdminCatalogMediaAssetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return { items, loading, error };
}
