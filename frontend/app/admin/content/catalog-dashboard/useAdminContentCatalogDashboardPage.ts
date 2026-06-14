"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getAdminContentCatalogGeoValidation,
  getAdminContentCatalogObservability,
  getAdminContentCatalogParity,
  type AdminCatalogGeoValidationSummary,
  type AdminCatalogObservabilityRow,
  type AdminCatalogParityCheckRow,
} from "@/lib/apiClient";

export function useAdminContentCatalogDashboardPage() {
  const [entities, setEntities] = useState<AdminCatalogObservabilityRow[]>([]);
  const [parity, setParity] = useState<AdminCatalogParityCheckRow[]>([]);
  const [parityPass, setParityPass] = useState(false);
  const [geo, setGeo] = useState<AdminCatalogGeoValidationSummary | null>(null);
  const [stats, setStats] = useState({ revisions: 0, rollbacks: 0, batches: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [obs, par, geoRes] = await Promise.all([
        getAdminContentCatalogObservability(),
        getAdminContentCatalogParity(),
        getAdminContentCatalogGeoValidation(),
      ]);
      const s = obs.summary;
      setEntities(s?.entities ?? []);
      setStats({
        revisions: s?.revisions_total ?? 0,
        rollbacks: s?.revisions_rollback ?? 0,
        batches: s?.import_batches ?? 0,
      });
      setParity(par.items ?? s?.parity_checks ?? []);
      setParityPass(par.parity_pass ?? s?.parity_pass ?? false);
      setGeo(geoRes.summary ?? null);
    } catch {
      setError("admin_content_catalog_dashboard_load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { entities, parity, parityPass, geo, stats, loading, error };
}
