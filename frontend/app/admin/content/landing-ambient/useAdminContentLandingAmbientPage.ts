"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getAdminContentCountries,
  getAdminContentLandingAmbient,
  patchAdminContentLandingAmbient,
  type AdminCatalogCountryRow,
  type AdminCountryLandingAmbientRow,
} from "@/lib/apiClient";

export type LandingAmbientListRow = AdminCatalogCountryRow & {
  landing?: AdminCountryLandingAmbientRow | null;
};

export function landingAmbientUrlFromRow(row: LandingAmbientListRow): string {
  const url = row.landing?.landing_ambient?.url;
  return typeof url === "string" ? url : "";
}

export function useAdminContentLandingAmbientPage() {
  const [items, setItems] = useState<LandingAmbientListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const countries = (await getAdminContentCountries()).items ?? [];
      const rows = await Promise.all(
        countries.map(async (c) => {
          try {
            const res = await getAdminContentLandingAmbient(c.id);
            return { ...c, landing: res.item ?? null };
          } catch {
            return { ...c, landing: null };
          }
        }),
      );
      setItems(rows);
    } catch {
      setError("admin_content_landing_ambient_load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function saveLandingUrl(row: LandingAmbientListRow, url: string) {
    const version = row.landing?.version ?? row.version;
    const trimmed = url.trim();
    const landing_ambient = {
      ...(row.landing?.landing_ambient ?? {}),
      url: trimmed,
    };
    setBusy(true);
    setError(null);
    try {
      await patchAdminContentLandingAmbient(row.id, { version, landing_ambient });
      await reload();
    } catch {
      setError("admin_content_landing_ambient_save_failed");
    } finally {
      setBusy(false);
    }
  }

  return { items, loading, error, busy, reload, saveLandingUrl };
}
