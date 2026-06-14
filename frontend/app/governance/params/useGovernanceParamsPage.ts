import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { apiUrl, routes } from "@/lib/api";
import { fetchJsonWithApiStatusLog } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import {
  buildFeeMetricDiffRows,
  protocolReferenceHasSubstance,
  type ProtocolRef84Mirror,
} from "@/lib/governanceParams84Readonly";

export function useGovernanceParamsPage() {
  const { t, locale } = useTranslation();
  const dash = t("ui_em_dash");
  const [data, setData] = useState<ProtocolRef84Mirror | null>(null);
  /** `undefined` = 加载中；`null` = 失败；否则为成功体 */
  const [pending, setPending] = useState<ProtocolRef84Mirror | null | undefined>(undefined);
  const [pendingErr, setPendingErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const cancelledRef = useRef(false);

  const retryAll = useCallback(() => setRetryTick((n) => n + 1), []);
  const retryPending = useCallback(() => setRetryTick((n) => n + 1), []);

  useEffect(() => {
    cancelledRef.current = false;
    setLoading(true);
    setError(null);
    setPending(undefined);
    setPendingErr(null);
    const headers: Record<string, string> = { "x-request-id": `gov-ref-${Date.now()}` };

    void (async () => {
      try {
        const cur = await fetchJsonWithApiStatusLog<ProtocolRef84Mirror>(
          "governanceProtocolReference",
          apiUrl(routes.governanceProtocolReference),
          { headers },
        );
        if (cancelledRef.current) return;
        if (!cur.res.ok) throw new Error(String(cur.res.status));
        setData(cur.body);
        setError(null);
      } catch (err) {
        if (cancelledRef.current) return;
        if (typeof window !== "undefined") {
          console.error("GovernanceParamsPage fetch protocol ref:", err);
        }
        setError(mapApiReadError(err, t, "governance_params_load_error"));
        setData(null);
      } finally {
        if (!cancelledRef.current) setLoading(false);
      }
    })();

    void (async () => {
      try {
        const pen = await fetchJsonWithApiStatusLog<ProtocolRef84Mirror>(
          "governanceProtocolReferencePending",
          apiUrl(routes.governanceProtocolReferencePending),
          { headers },
        );
        if (cancelledRef.current) return;
        if (!pen.res.ok) throw new Error(String(pen.res.status));
        setPending(pen.body);
        setPendingErr(null);
      } catch (err) {
        if (cancelledRef.current) return;
        if (typeof window !== "undefined") {
          console.error("GovernanceParamsPage fetch protocol ref pending:", err);
        }
        setPending(null);
        setPendingErr(mapApiReadError(err, t, "governance_params_pending_load_error"));
      }
    })();

    return () => {
      cancelledRef.current = true;
    };
  }, [t, retryTick]);

  const l1 = data?.fee_router?.layer1_percent_of_allocatable_platform_fee;
  const gsplit = data?.fee_router?.global_pool_split_percent;
  const diffRows =
    data && pending && protocolReferenceHasSubstance(data) && protocolReferenceHasSubstance(pending)
      ? buildFeeMetricDiffRows(data, pending)
      : null;
  const allMatch =
    diffRows != null && diffRows.length > 0 && diffRows.every((r) => r.cur === r.pen);
  const pendingSource =
    typeof pending?.pending_package_source === "string" && pending.pending_package_source.trim() !== ""
      ? pending.pending_package_source.trim()
      : null;

  return {
    t,
    locale,
    dash,
    loading,
    error,
    data,
    pending,
    pendingErr,
    l1,
    gsplit,
    diffRows,
    allMatch,
    pendingSource,
    retryAll,
    retryPending,
  };
}
