// search-params gate: parent route provides Suspense boundary.
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import {
  type AdminFetchErrorKind,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";

import {
  LIFECYCLE_DOMAIN_MAX,
  LIFECYCLE_ENTITY_MAX,
  LIFECYCLE_MACHINE_CODE_MAX,
  LIFECYCLE_SOT_MAX,
  LIFECYCLE_VERSION_MAX,
  type LifecycleListRes,
  type LifecycleStateMachineRow,
  buildLifecycleListPath,
  normalizeLifecycleAnomalyUrl,
  parseLifecycleListQuery,
} from "./adminLifecyclePageModel";

export function useAdminLifecyclePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { limit, machineCode, domain, entityType, version, sourceOfTruth, anomalyFlag } = useMemo(
    () => parseLifecycleListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<LifecycleStateMachineRow[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftMachine, setDraftMachine] = useState(machineCode);
  const [draftDomain, setDraftDomain] = useState(domain);
  const [draftEntity, setDraftEntity] = useState(entityType);
  const [draftVersion, setDraftVersion] = useState(version);
  const [draftSot, setDraftSot] = useState(sourceOfTruth);
  const [draftAnomaly, setDraftAnomaly] = useState(anomalyFlag);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftMachine(machineCode);
    setDraftDomain(domain);
    setDraftEntity(entityType);
    setDraftVersion(version);
    setDraftSot(sourceOfTruth);
    setDraftAnomaly(anomalyFlag);
  }, [limit, machineCode, domain, entityType, version, sourceOfTruth, anomalyFlag]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);
    setAppliedFilters(null);

    const n = Number.parseInt(String(limit), 10);
    const effLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;

    const headers: Record<string, string> = { "x-request-id": `admin-lifecycle-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<LifecycleListRes>(
      "AdminLifecyclePage",
      apiUrl(
        routes.admin.lifecycleStateMachines({
          limit: effLimit,
          ...(machineCode ? { machine_code: machineCode } : {}),
          ...(domain ? { domain } : {}),
          ...(entityType ? { entity_type: entityType } : {}),
          ...(version ? { version } : {}),
          ...(sourceOfTruth ? { source_of_truth: sourceOfTruth } : {}),
          ...(anomalyFlag ? { anomaly_flag: anomalyFlag } : {}),
        }),
      ),
      { headers },
    )
      .then(({ res, body }) => {
        if (!res.ok) {
          throw new Error(body.error || `request_failed_${res.status}`);
        }
        return body;
      })
      .then((body) => {
        setItems(Array.isArray(body.items) ? body.items : []);
        setMeta(isAdminMetaRecord(body.meta) ? body.meta : null);
        setAppliedFilters(body.applied_filters ?? null);
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminLifecyclePage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [limit, machineCode, domain, entityType, version, sourceOfTruth, anomalyFlag]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    const nextAnomaly = normalizeLifecycleAnomalyUrl(draftAnomaly);
    router.push(
      buildLifecycleListPath({
        limit: nextLimit,
        machineCode: draftMachine.trim().slice(0, LIFECYCLE_MACHINE_CODE_MAX),
        domain: draftDomain.trim().slice(0, LIFECYCLE_DOMAIN_MAX),
        entityType: draftEntity.trim().slice(0, LIFECYCLE_ENTITY_MAX),
        version: draftVersion.trim().slice(0, LIFECYCLE_VERSION_MAX),
        sourceOfTruth: draftSot.trim().slice(0, LIFECYCLE_SOT_MAX),
        anomalyFlag: nextAnomaly,
      }),
    );
  };

  const clearNonLimitFilters = () => {
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : limit;
    router.push(
      buildLifecycleListPath({
        limit: nextLimit,
        machineCode: "",
        domain: "",
        entityType: "",
        version: "",
        sourceOfTruth: "",
        anomalyFlag: "",
      }),
    );
  };

  const hasActiveFilters =
    Boolean(machineCode) ||
    Boolean(domain) ||
    Boolean(entityType) ||
    Boolean(version) ||
    Boolean(sourceOfTruth) ||
    Boolean(anomalyFlag);

  return {
    loading,
    error,
    items,
    meta,
    appliedFilters,
    draftLimit,
    setDraftLimit,
    draftMachine,
    setDraftMachine,
    draftDomain,
    setDraftDomain,
    draftEntity,
    setDraftEntity,
    draftVersion,
    setDraftVersion,
    draftSot,
    setDraftSot,
    draftAnomaly,
    setDraftAnomaly,
    apply,
    clearNonLimitFilters,
    hasActiveFilters,
  };
}
