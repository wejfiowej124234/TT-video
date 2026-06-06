// search-params gate: parent route provides Suspense boundary.
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useId, useMemo, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { routes } from "@/lib/api";
import { useAdminStandardListFetch } from "@/lib/admin/useAdminStandardListFetch";
import {
  API_STATUS_URL,
  API_VER_SUB_MAX,
  type AdminApiVersionRow,
  buildAdminApiVersionsListPath,
  parseAdminApiVersionsListQuery,
} from "./adminApiVersionsPageModel";

export function useAdminApiVersionsPage() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const limitInputId = useId();
  const versionInputId = useId();
  const statusInputId = useId();
  const adminFilterHintId = useId();
  const apiVersionsActiveVersionDescId = useId();
  const apiVersionsActiveStatusDescId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { limit, apiVersion, status } = useMemo(
    () => parseAdminApiVersionsListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const listUrl = useMemo(() => {
    const n = Number.parseInt(String(limit), 10);
    const effLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    return routes.admin.apiVersions({
      limit: effLimit,
      ...(apiVersion ? { api_version: apiVersion } : {}),
      ...(status ? { status } : {}),
    });
  }, [limit, apiVersion, status]);

  const { items, meta, appliedFilters, loading, refreshing, error } =
    useAdminStandardListFetch<AdminApiVersionRow>({
      scope: "api-versions",
      context: "AdminApiVersionsPage",
      listUrl,
    });

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftApiVersion, setDraftApiVersion] = useState(apiVersion);
  const [draftStatus, setDraftStatus] = useState(status);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftApiVersion(apiVersion);
    setDraftStatus(status);
  }, [limit, apiVersion, status]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    const st = draftStatus.trim().toLowerCase();
    const nextStatus = API_STATUS_URL.has(st) ? st : "";
    router.push(
      buildAdminApiVersionsListPath({
        limit: nextLimit,
        apiVersion: draftApiVersion.trim().slice(0, API_VER_SUB_MAX),
        status: nextStatus,
      }),
    );
  };

  const clearNonLimitFilters = () => {
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : limit;
    router.push(
      buildAdminApiVersionsListPath({
        limit: nextLimit,
        apiVersion: "",
        status: "",
      }),
    );
  };

  const hasActiveFilters = Boolean(apiVersion) || Boolean(status);

  return {
    t,
    pageTitleId,
    limitInputId,
    versionInputId,
    statusInputId,
    adminFilterHintId,
    apiVersionsActiveVersionDescId,
    apiVersionsActiveStatusDescId,
    adminAppliedFiltersDescId,
    adminListApplyResetHintId,
    apiVersion,
    status,
    loading,
    refreshing,
    error,
    items,
    meta,
    appliedFilters,
    draftLimit,
    setDraftLimit,
    draftApiVersion,
    setDraftApiVersion,
    draftStatus,
    setDraftStatus,
    apply,
    clearNonLimitFilters,
    hasActiveFilters,
  };
}

export type AdminApiVersionsPageViewModel = ReturnType<typeof useAdminApiVersionsPage>;
