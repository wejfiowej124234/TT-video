// search-params gate: parent route provides Suspense boundary.
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useId, useMemo, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { useAdminStandardListFetch } from "@/lib/admin/useAdminStandardListFetch";
import { routes } from "@/lib/api";
import {
  type ConfigReleaseRow,
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

  const listUrl = useMemo(
    () =>
      routes.admin.configReleases({
        limit,
        ...(releaseKey ? { release_key: releaseKey } : {}),
        ...(status ? { status } : {}),
      }),
    [limit, releaseKey, status],
  );

  const { items, appliedFilters, meta, loading, refreshing, error } =
    useAdminStandardListFetch<ConfigReleaseRow>({
      scope: "config-releases",
      context: "AdminConfigReleasesPage",
      listUrl,
    });

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftReleaseKey, setDraftReleaseKey] = useState(releaseKey);
  const [draftStatus, setDraftStatus] = useState(status);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftReleaseKey(releaseKey);
    setDraftStatus(status);
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
    refreshing,
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
