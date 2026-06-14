"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getAdminContentCatalogGeoValidation,
  getAdminContentCatalogGeoValidationHistory,
  type AdminCatalogGeoValidationHistoryRow,
  type AdminCatalogGeoValidationSummary,
} from "@/lib/apiClient";

export function useAdminContentGeoValidationPage() {
  const [summary, setSummary] = useState<AdminCatalogGeoValidationSummary | null>(null);
  const [history, setHistory] = useState<AdminCatalogGeoValidationHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [geoRes, histRes] = await Promise.all([
        getAdminContentCatalogGeoValidation(),
        getAdminContentCatalogGeoValidationHistory({ limit: 30 }),
      ]);
      setSummary(geoRes.summary ?? null);
      setHistory(histRes.items ?? []);
    } catch {
      setError("admin_content_geo_validation_load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { summary, history, loading, error, reload };
}
