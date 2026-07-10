import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { apiUrl, routes } from "@/lib/api";
import { fetchJsonWithApiStatusLog } from "@/lib/apiClient";
import { resolveGovernanceParamsProtocolData } from "@/lib/governance/governanceParamsProtocolReferenceMirror";
import {
  buildFeeMetricDiffRows,
  protocolReferenceHasSubstance,
  type ProtocolRef84Mirror,
} from "@/lib/governanceParams84Readonly";

export type GovernanceParamsDataSource = "api" | "mirror";

function logGovernanceParamsMirrorFallback(scope: "protocol-reference" | "protocol-reference-pending", status: number) {
  if (typeof window === "undefined" || process.env.NODE_ENV === "production") return;
  console.debug(`[governance/params] ${scope} HTTP ${status}; using bundled SSOT mirror.`);
}

export function useGovernanceParamsPage() {
  const { t, locale } = useTranslation();
  const dash = t("ui_em_dash");
  const [apiData, setApiData] = useState<ProtocolRef84Mirror | null>(null);
  const [apiLoadFailed, setApiLoadFailed] = useState(false);
  const [apiLoadError, setApiLoadError] = useState<string | null>(null);
  /** `undefined` = 加载中；`null` = 失败；否则为成功体 */
  const [pending, setPending] = useState<ProtocolRef84Mirror | null | undefined>(undefined);
  const [pendingErr, setPendingErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryTick, setRetryTick] = useState(0);
  const cancelledRef = useRef(false);

  const retryAll = useCallback(() => setRetryTick((n) => n + 1), []);
  const retryPending = useCallback(() => setRetryTick((n) => n + 1), []);

  useEffect(() => {
    cancelledRef.current = false;
    setLoading(true);
    setApiLoadFailed(false);
    setApiLoadError(null);
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
        if (!cur.res.ok) {
          logGovernanceParamsMirrorFallback("protocol-reference", cur.res.status);
          setApiData(null);
          setApiLoadFailed(true);
          setApiLoadError(t("governance_params_load_error"));
          return;
        }
        if (!protocolReferenceHasSubstance(cur.body)) {
          logGovernanceParamsMirrorFallback("protocol-reference", cur.res.status);
          setApiData(null);
          setApiLoadFailed(true);
          setApiLoadError(t("governance_params_body_incomplete"));
          return;
        }
        setApiData(cur.body);
        setApiLoadFailed(false);
        setApiLoadError(null);
      } catch (err) {
        if (cancelledRef.current) return;
        logGovernanceParamsMirrorFallback("protocol-reference", 0);
        if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
          console.debug("[governance/params] protocol-reference fetch failed; using bundled SSOT mirror.", err);
        }
        setApiData(null);
        setApiLoadFailed(true);
        setApiLoadError(t("governance_params_load_error"));
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
        if (!pen.res.ok) {
          logGovernanceParamsMirrorFallback("protocol-reference-pending", pen.res.status);
          setPending(null);
          setPendingErr(null);
          return;
        }
        setPending(pen.body);
        setPendingErr(null);
      } catch (err) {
        if (cancelledRef.current) return;
        logGovernanceParamsMirrorFallback("protocol-reference-pending", 0);
        if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
          console.debug("[governance/params] protocol-reference/pending unavailable; skipping diff check.", err);
        }
        setPending(null);
        setPendingErr(null);
      }
    })();

    return () => {
      cancelledRef.current = true;
    };
  }, [t, retryTick]);

  const { data, source: dataSource } = useMemo(
    () => resolveGovernanceParamsProtocolData(apiData, apiLoadFailed),
    [apiData, apiLoadFailed],
  );

  const effectivePending = useMemo(() => {
    if (pending !== null && pending !== undefined) return pending;
    return data ?? apiData ?? null;
  }, [pending, data, apiData]);

  const currentRef = apiData ?? (apiLoadFailed ? data : null);
  const diffRows = useMemo(() => {
    if (!currentRef || !effectivePending) return null;
    if (!protocolReferenceHasSubstance(currentRef) || !protocolReferenceHasSubstance(effectivePending)) return null;
    return buildFeeMetricDiffRows(currentRef, effectivePending);
  }, [currentRef, effectivePending]);

  const allMatch = useMemo(() => {
    if (apiLoadFailed || pending === null) return true;
    return diffRows != null && diffRows.length > 0 && diffRows.every((r) => r.cur === r.pen);
  }, [apiLoadFailed, pending, diffRows]);

  const l1 = data?.fee_router?.layer1_percent_of_allocatable_platform_fee;
  const gsplit = data?.fee_router?.global_pool_split_percent;
  const pendingSource =
    typeof pending?.pending_package_source === "string" && pending.pending_package_source.trim() !== ""
      ? pending.pending_package_source.trim()
      : null;

  return {
    t,
    locale,
    dash,
    loading,
    error: apiLoadFailed ? apiLoadError : null,
    data,
    dataSource,
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
