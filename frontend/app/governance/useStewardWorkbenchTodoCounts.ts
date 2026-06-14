"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { apiUrl, routes } from "@/lib/api";
import { fetchJsonWithApiStatusLog, getAuthHeaders, getGovernanceDelegate } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import type { RewardsRes } from "@/app/governance/governanceHubPageModel";
import {
  mergeStewardWorkbenchTodoCounts,
  type StewardWorkbenchTodoCountsState,
} from "@/lib/governance/stewardWorkbenchTodoModel";

type ProposalsRes = {
  status?: string;
  items?: Array<{ status?: string | null }>;
  data_source?: string;
};

export function useStewardWorkbenchTodoCounts(enabled: boolean): StewardWorkbenchTodoCountsState & {
  error: string | null;
  retry: () => void;
} {
  const { t } = useTranslation();
  const [counts, setCounts] = useState<StewardWorkbenchTodoCountsState["counts"]>(null);
  const [loading, setLoading] = useState(enabled);
  const [dataSource, setDataSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setCounts(null);
      setDataSource(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const headers: Record<string, string> = { "x-request-id": `steward-todo-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      if (!cancelled) {
        setLoading(false);
        setCounts(null);
      }
      return;
    }

    Promise.all([
      fetchJsonWithApiStatusLog<ProposalsRes>("governanceProposals", apiUrl(routes.governanceProposals), {
        headers,
      }),
      getGovernanceDelegate().catch(() => null),
      fetchJsonWithApiStatusLog<RewardsRes>("governanceRewards", apiUrl(routes.governanceRewards), { headers }),
    ])
      .then(([proposalsFr, delegateRes, rewardsFr]) => {
        if (cancelled) return;
        const proposalItems =
          proposalsFr.res.ok && Array.isArray(proposalsFr.body?.items) ? proposalsFr.body.items : [];
        const delegateTo = delegateRes?.delegate_to ?? null;
        const rewards = rewardsFr.res.ok ? rewardsFr.body : null;
        const ds =
          (typeof proposalsFr.body?.data_source === "string" && proposalsFr.body.data_source) ||
          (typeof rewards?.data_source === "string" && rewards.data_source) ||
          delegateRes?.data_source ||
          null;
        setCounts(
          mergeStewardWorkbenchTodoCounts({
            proposalItems,
            delegateTo,
            rewards,
          }),
        );
        setDataSource(ds);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setCounts(null);
        setDataSource(null);
        setError(mapApiReadError(err, t, "steward_workbench_todo_counts_fail"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, retryTick, t]);

  return {
    counts,
    loading,
    dataSource,
    error,
    retry: () => setRetryTick((n) => n + 1),
  };
}
