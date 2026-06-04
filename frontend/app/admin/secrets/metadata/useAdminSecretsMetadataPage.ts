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
  ENV_SCOPE_RE,
  KEY_ALIAS_MAX_LEN,
  type SecretsMetadataRes,
  type SecretsMetadataRow,
  buildListPath,
  parseListQuery,
} from "./adminSecretsMetadataPageModel";

export function useAdminSecretsMetadataPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { limit, keyAlias, status, envScope } = useMemo(
    () => parseListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<SecretsMetadataRow[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftKeyAlias, setDraftKeyAlias] = useState(keyAlias);
  const [draftStatus, setDraftStatus] = useState(status);
  const [draftEnvScope, setDraftEnvScope] = useState(envScope);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftKeyAlias(keyAlias);
    setDraftStatus(status);
    setDraftEnvScope(envScope);
  }, [limit, keyAlias, status, envScope]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);
    setAppliedFilters(null);

    const headers: Record<string, string> = { "x-request-id": `admin-secrets-meta-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<SecretsMetadataRes>(
      "AdminSecretsMetadataPage",
      apiUrl(
        routes.admin.secretsMetadata({
          limit,
          ...(keyAlias ? { key_alias: keyAlias } : {}),
          ...(status ? { status } : {}),
          ...(envScope ? { env_scope: envScope } : {}),
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
        logAdminFetch("AdminSecretsMetadataPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [limit, keyAlias, status, envScope]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 200;
    let nextEnv = draftEnvScope.trim();
    if (nextEnv !== "" && !ENV_SCOPE_RE.test(nextEnv)) {
      nextEnv = "";
    }
    router.push(
      buildListPath({
        limit: nextLimit,
        keyAlias: draftKeyAlias.trim().slice(0, KEY_ALIAS_MAX_LEN),
        status: draftStatus,
        envScope: nextEnv,
      }),
    );
  };

  const clearNonLimitFilters = () => {
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : limit;
    router.push(buildListPath({ limit: nextLimit, keyAlias: "", status: "", envScope: "" }));
  };

  const hasActiveFilters = Boolean(keyAlias) || Boolean(status) || Boolean(envScope);

  return {
    limit,
    keyAlias,
    status,
    envScope,
    loading,
    error,
    items,
    meta,
    appliedFilters,
    draftLimit,
    setDraftLimit,
    draftKeyAlias,
    setDraftKeyAlias,
    draftStatus,
    setDraftStatus,
    draftEnvScope,
    setDraftEnvScope,
    apply,
    clearNonLimitFilters,
    hasActiveFilters,
  };
}

export type AdminSecretsMetadataPageViewModel = ReturnType<typeof useAdminSecretsMetadataPage>;
