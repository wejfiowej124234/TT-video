"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getMeMerchantListingsSummary,
  type MeMerchantListingsSummary,
} from "@/lib/apiClient/meMerchantListingsSummary";
import { mapApiReadError } from "@/lib/mapApiReadError";

export function useProviderWorkbenchListingsSummary(enabled: boolean, t: (key: string) => string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<MeMerchantListingsSummary | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      setSummary(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const body = await getMeMerchantListingsSummary();
      setSummary(body.summary ?? null);
    } catch (e) {
      setSummary(null);
      setError(mapApiReadError(e, t, "provider_workbench_listings_summary_load_fail"));
    } finally {
      setLoading(false);
    }
  }, [enabled, t]);

  useEffect(() => {
    void load();
  }, [load]);

  return { summary, loading, error, retry: load };
}
