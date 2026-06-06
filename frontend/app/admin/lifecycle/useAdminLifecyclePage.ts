// search-params gate: parent route provides Suspense boundary.
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { routes } from "@/lib/api";
import { useAdminStandardListFetch } from "@/lib/admin/useAdminStandardListFetch";

import {
  LIFECYCLE_DOMAIN_MAX,
  LIFECYCLE_ENTITY_MAX,
  LIFECYCLE_MACHINE_CODE_MAX,
  LIFECYCLE_SOT_MAX,
  LIFECYCLE_VERSION_MAX,
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

  const listUrl = useMemo(() => {
    const n = Number.parseInt(String(limit), 10);
    const effLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    return routes.admin.lifecycleStateMachines({
      limit: effLimit,
      ...(machineCode ? { machine_code: machineCode } : {}),
      ...(domain ? { domain } : {}),
      ...(entityType ? { entity_type: entityType } : {}),
      ...(version ? { version } : {}),
      ...(sourceOfTruth ? { source_of_truth: sourceOfTruth } : {}),
      ...(anomalyFlag ? { anomaly_flag: anomalyFlag } : {}),
    });
  }, [limit, machineCode, domain, entityType, version, sourceOfTruth, anomalyFlag]);

  const { items, meta, appliedFilters, loading, refreshing, error } =
    useAdminStandardListFetch<LifecycleStateMachineRow>({
      scope: "lifecycle-state-machines",
      context: "AdminLifecyclePage",
      listUrl,
    });

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
    refreshing,
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
