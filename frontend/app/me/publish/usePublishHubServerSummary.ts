"use client";

import { useCallback, useEffect, useState } from "react";
import { getMePublishSummary } from "@/lib/apiClient/mePublishSummary";
import type { PublishHubServerSummaryCounts } from "@/lib/me/publishHubServerSummaryModel";

export function usePublishHubServerSummary(enabled: boolean) {
  const [counts, setCounts] = useState<PublishHubServerSummaryCounts | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!enabled) {
      setCounts(null);
      setError(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const next = await getMePublishSummary();
      setCounts(next);
    } catch {
      setError(true);
      setCounts(null);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  return { counts, loading, error, retry: load };
}
