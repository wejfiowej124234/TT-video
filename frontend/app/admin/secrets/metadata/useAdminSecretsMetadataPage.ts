// search-params gate: parent route provides Suspense boundary.
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { routes } from "@/lib/api";
import { useAdminStandardListFetch } from "@/lib/admin/useAdminStandardListFetch";

import {
  ENV_SCOPE_RE,
  KEY_ALIAS_MAX_LEN,
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

  const listUrl = useMemo(
    () =>
      routes.admin.secretsMetadata({
        limit,
        ...(keyAlias ? { key_alias: keyAlias } : {}),
        ...(status ? { status } : {}),
        ...(envScope ? { env_scope: envScope } : {}),
      }),
    [limit, keyAlias, status, envScope],
  );

  const { items, meta, appliedFilters, loading, refreshing, error } =
    useAdminStandardListFetch<SecretsMetadataRow>({
      scope: "secrets-metadata",
      context: "AdminSecretsMetadataPage",
      listUrl,
    });

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
    refreshing,
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
