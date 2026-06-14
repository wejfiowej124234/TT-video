import { useEffect, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { apiUrl, routes } from "@/lib/api";
import { fetchJsonWithApiStatusLog, getAuthHeaders } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import {
  governanceHttpErrorLine,
  type PoolRes,
  type RewardsRes,
} from "./governanceHubPageModel";

export function useGovernanceHubPage(enabled = true) {
  const { t } = useTranslation();
  const [pool, setPool] = useState<PoolRes | null>(null);
  const [rewards, setRewards] = useState<RewardsRes | null>(null);
  const [poolHttpError, setPoolHttpError] = useState<string | null>(null);
  const [rewardsHttpError, setRewardsHttpError] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setError(null);
      setPoolHttpError(null);
      setRewardsHttpError(null);
      return;
    }
    setLoading(true);
    setError(null);
    setPoolHttpError(null);
    setRewardsHttpError(null);
    const headers: Record<string, string> = { "x-request-id": `gov-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // optional auth
    }
    Promise.all([
      fetchJsonWithApiStatusLog<PoolRes>("governancePool", apiUrl(routes.governancePool), { headers }),
      fetchJsonWithApiStatusLog<RewardsRes>("governanceRewards", apiUrl(routes.governanceRewards), {
        headers,
      }),
    ])
      .then(([poolFr, rewardsFr]) => {
        setError(null);
        if (poolFr.res.ok) {
          setPool(poolFr.body);
          setPoolHttpError(null);
        } else {
          setPool(null);
          setPoolHttpError(governanceHttpErrorLine(t, "pool", poolFr.res.status, poolFr.body));
        }
        if (rewardsFr.res.ok) {
          setRewards(rewardsFr.body);
          setRewardsHttpError(null);
        } else {
          setRewards(null);
          setRewardsHttpError(governanceHttpErrorLine(t, "rewards", rewardsFr.res.status, rewardsFr.body));
        }
      })
      .catch((e) => {
        if (typeof window !== "undefined") {
          console.error("GovernancePage:", e);
        }
        setPool(null);
        setRewards(null);
        setPoolHttpError(null);
        setRewardsHttpError(null);
        setError(mapApiReadError(e, t, "governance_requestFailed"));
      })
      .finally(() => setLoading(false));
  }, [t, enabled]);

  return {
    t,
    pool,
    rewards,
    poolHttpError,
    rewardsHttpError,
    loading,
    error,
  };
}
