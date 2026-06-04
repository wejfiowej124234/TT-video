// search-params gate: parent route provides Suspense boundary.
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useId, useMemo, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
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
  API_STATUS_URL,
  API_VER_SUB_MAX,
  type AdminApiVersionRow,
  type AdminApiVersionsListRes,
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<AdminApiVersionRow[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftApiVersion, setDraftApiVersion] = useState(apiVersion);
  const [draftStatus, setDraftStatus] = useState(status);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftApiVersion(apiVersion);
    setDraftStatus(status);
  }, [limit, apiVersion, status]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);
    setAppliedFilters(null);

    const n = Number.parseInt(String(limit), 10);
    const effLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;

    const headers: Record<string, string> = { "x-request-id": `admin-api-versions-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403 below
    }

    adminFetchJson<AdminApiVersionsListRes>(
      "AdminApiVersionsPage",
      apiUrl(
        routes.admin.apiVersions({
          limit: effLimit,
          ...(apiVersion ? { api_version: apiVersion } : {}),
          ...(status ? { status } : {}),
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
        logAdminFetch("AdminApiVersionsPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
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
