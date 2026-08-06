// search-params gate: parent route provides Suspense boundary.
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useAdminStandardListFetch } from "@/lib/admin/useAdminStandardListFetch";
import { routes } from "@/lib/api";

import {
  ADMIN_GUIDES_CITY_MAX,
  ADMIN_GUIDES_COUNTRY_MAX,
  ADMIN_GUIDES_Q_MAX,
  ADMIN_GUIDES_STATUS_MAX,
  type AdminGuideRow,
  buildGuidesListPath,
  clampGuideLimit,
  parseGuidesListQuery,
} from "./adminGuidesPageModel";

export function useAdminGuidesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { limit, status, city, country_code, q } = useMemo(
    () => parseGuidesListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const listUrl = useMemo(
    () =>
      routes.admin.guides({
        limit,
        ...(status ? { status } : {}),
        ...(city ? { city } : {}),
        ...(country_code ? { country_code } : {}),
        ...(q ? { q } : {}),
      }),
    [limit, status, city, country_code, q],
  );

  const { items, appliedFilters, meta, total, loading, refreshing, error } =
    useAdminStandardListFetch<AdminGuideRow>({
      scope: "guides",
      context: "AdminGuidesPage",
      listUrl,
    });

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftStatus, setDraftStatus] = useState(status);
  const [draftCity, setDraftCity] = useState(city);
  const [draftCountry, setDraftCountry] = useState(country_code);
  const [draftQ, setDraftQ] = useState(q);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftStatus(status);
    setDraftCity(city);
    setDraftCountry(country_code);
    setDraftQ(q);
  }, [limit, status, city, country_code, q]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const lim = clampGuideLimit(Number.parseInt(draftLimit.trim(), 10));
    router.push(
      buildGuidesListPath({
        limit: lim,
        status: draftStatus.trim().slice(0, ADMIN_GUIDES_STATUS_MAX),
        city: draftCity.trim().slice(0, ADMIN_GUIDES_CITY_MAX),
        country_code: draftCountry.trim().slice(0, ADMIN_GUIDES_COUNTRY_MAX),
        q: draftQ.trim().slice(0, ADMIN_GUIDES_Q_MAX),
      }),
    );
  };

  const reset = () => {
    router.push(
      buildGuidesListPath({
        limit: 100,
        status: "",
        city: "",
        country_code: "",
        q: "",
      }),
    );
  };

  return {
    limit,
    status,
    city,
    country_code,
    q,
    loading,
    refreshing,
    error,
    items,
    appliedFilters,
    meta,
    total,
    draftLimit,
    setDraftLimit,
    draftStatus,
    setDraftStatus,
    draftCity,
    setDraftCity,
    draftCountry,
    setDraftCountry,
    draftQ,
    setDraftQ,
    apply,
    reset,
  };
}
