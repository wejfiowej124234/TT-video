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
  type ConfigReleaseRow,
  type ConfigReleasesListRes,
  RELEASE_KEY_MAX_LEN,
  buildConfigReleasesListPath,
  parseConfigReleasesListQuery,
} from "./configReleasesPageModel";

export function useAdminConfigReleasesPage() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const releaseKeyInputId = useId();
  const statusSelectId = useId();
  const limitInputId = useId();
  const adminFilterHintId = useId();
  const configReleasesActiveKeyDescId = useId();
  const configReleasesActiveStatusDescId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { limit, releaseKey, status } = useMemo(
    () => parseConfigReleasesListQuery(new URLSearchParams(searchParams?.toString() ?? "")),
    [searchParams],
  );

  const listQueryString = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("limit", String(limit));
    if (releaseKey) sp.set("release_key", releaseKey);
    if (status) sp.set("status", status);
    return sp.toString();
  }, [limit, releaseKey, status]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<ConfigReleaseRow[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftReleaseKey, setDraftReleaseKey] = useState(releaseKey);
  const [draftStatus, setDraftStatus] = useState(status);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftReleaseKey(releaseKey);
    setDraftStatus(status);
  }, [limit, releaseKey, status]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);
    setAppliedFilters(null);

    const headers: Record<string, string> = { "x-request-id": `admin-config-rel-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<ConfigReleasesListRes>(
      "AdminConfigReleasesPage",
      apiUrl(
        routes.admin.configReleases({
          limit,
          ...(releaseKey ? { release_key: releaseKey } : {}),
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
        logAdminFetch("AdminConfigReleasesPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [limit, releaseKey, status]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    router.push(
      buildConfigReleasesListPath({
        limit: nextLimit,
        releaseKey: draftReleaseKey.trim().slice(0, RELEASE_KEY_MAX_LEN),
        status: draftStatus,
      }),
    );
  };

  const clearNonLimitFilters = () => {
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : limit;
    router.push(buildConfigReleasesListPath({ limit: nextLimit, releaseKey: "", status: "" }));
  };

  const hasActiveFilters = Boolean(releaseKey) || Boolean(status);

  return {
    t,
    pageTitleId,
    releaseKeyInputId,
    statusSelectId,
    limitInputId,
    adminFilterHintId,
    configReleasesActiveKeyDescId,
    configReleasesActiveStatusDescId,
    adminAppliedFiltersDescId,
    adminListApplyResetHintId,
    limit,
    releaseKey,
    status,
    listQueryString,
    loading,
    error,
    items: items ?? [],
    meta,
    appliedFilters,
    draftLimit,
    setDraftLimit,
    draftReleaseKey,
    setDraftReleaseKey,
    draftStatus,
    setDraftStatus,
    apply,
    clearNonLimitFilters,
    hasActiveFilters,
  };
}

export type AdminConfigReleasesPageViewModel = ReturnType<typeof useAdminConfigReleasesPage>;
