"use client";

import { useCallback, useEffect, useState } from "react";
import { getMyGovernanceProposalsList } from "@/lib/apiClient/governance";
import { mapApiReadError } from "@/lib/mapApiReadError";

export type PublishHubGovernanceProposalRow = {
  id: string;
  title: string;
  status: string;
  href: string;
};

const GOVERNANCE_RAIL_LIMIT = 10;

export function usePublishHubGovernanceRail(enabled: boolean, t: (key: string) => string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<PublishHubGovernanceProposalRow[]>([]);

  const load = useCallback(async () => {
    if (!enabled) {
      setRows([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const body = await getMyGovernanceProposalsList(GOVERNANCE_RAIL_LIMIT);
      const mapped = (body.items ?? [])
        .slice(0, GOVERNANCE_RAIL_LIMIT)
        .map((item) => {
          const id = typeof item.id === "string" ? item.id.trim() : "";
          if (!id) return null;
          const title =
            (typeof item.title === "string" && item.title.trim()) || t("publish_hub_governance_untitled");
          const status =
            (typeof item.status === "string" && item.status.trim()) || "pending";
          return {
            id,
            title,
            status,
            href: `/governance/proposals/${encodeURIComponent(id)}`,
          };
        })
        .filter((row): row is PublishHubGovernanceProposalRow => row != null);
      setRows(mapped);
    } catch (e) {
      setRows([]);
      setError(mapApiReadError(e, t, "publish_hub_governance_load_fail"));
    } finally {
      setLoading(false);
    }
  }, [enabled, t]);

  useEffect(() => {
    void load();
  }, [load]);

  return { rows, loading, error, retry: load, count: rows.length };
}
