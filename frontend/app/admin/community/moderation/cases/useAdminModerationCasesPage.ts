// search-params gate: parent route provides Suspense boundary.
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { routes } from "@/lib/api";
import { isUuidString } from "@/lib/isUuidString";
import { useAdminStandardListFetch } from "@/lib/admin/useAdminStandardListFetch";
import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import type { AdminModerationCaseRow } from "./adminModerationCasesPageTypes";
import {
  ADMIN_MOD_CASES_STATUS_AFTER_MAX,
  ADMIN_MOD_CASES_STATUS_BEFORE_MAX,
  buildModerationCasesPath,
  parseModerationCasesQuery,
} from "./adminModerationCasesPageModel";

export type AdminModerationCasesPageViewModel = {
  listQ: ReturnType<typeof parseModerationCasesQuery>;
  loading: boolean;
  refreshing: boolean;
  error: AdminFetchErrorKind | null;
  items: AdminModerationCaseRow[];
  meta: Record<string, unknown> | null;
  appliedFilters: Record<string, unknown> | null;
  draftLimit: string;
  setDraftLimit: (v: string) => void;
  draftReportId: string;
  setDraftReportId: (v: string) => void;
  draftActorId: string;
  setDraftActorId: (v: string) => void;
  draftStatusBefore: string;
  setDraftStatusBefore: (v: string) => void;
  draftStatusAfter: string;
  setDraftStatusAfter: (v: string) => void;
  apply: (e?: FormEvent) => void;
  clearNonLimitFilters: () => void;
  hasExtraFilters: boolean;
};

export function useAdminModerationCasesPage(): AdminModerationCasesPageViewModel {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listQ = useMemo(
    () => parseModerationCasesQuery(new URLSearchParams(searchParams?.toString() ?? "")),
    [searchParams],
  );

  const listUrl = useMemo(
    () =>
      routes.admin.communityModerationCases({
        limit: listQ.limit,
        report_id: listQ.reportId || undefined,
        actor_id: listQ.actorId || undefined,
        status_before: listQ.statusBefore || undefined,
        status_after: listQ.statusAfter || undefined,
      }),
    [listQ],
  );

  const { items, meta, appliedFilters, loading, refreshing, error } =
    useAdminStandardListFetch<AdminModerationCaseRow>({
      scope: "community-moderation-cases",
      context: "AdminCommunityModerationCasesPage",
      listUrl,
    });

  const [draftLimit, setDraftLimit] = useState(String(listQ.limit));
  const [draftReportId, setDraftReportId] = useState(listQ.reportId);
  const [draftActorId, setDraftActorId] = useState(listQ.actorId);
  const [draftStatusBefore, setDraftStatusBefore] = useState(listQ.statusBefore);
  const [draftStatusAfter, setDraftStatusAfter] = useState(listQ.statusAfter);

  useEffect(() => {
    setDraftLimit(String(listQ.limit));
    setDraftReportId(listQ.reportId);
    setDraftActorId(listQ.actorId);
    setDraftStatusBefore(listQ.statusBefore);
    setDraftStatusAfter(listQ.statusAfter);
  }, [listQ]);

  const apply = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      const n = Number.parseInt(draftLimit.trim(), 10);
      const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
      const rTrim = draftReportId.trim();
      const nextRep = isUuidString(rTrim) ? rTrim : "";
      const aTrim = draftActorId.trim();
      const nextAct = isUuidString(aTrim) ? aTrim : "";
      router.push(
        buildModerationCasesPath({
          limit: nextLimit,
          reportId: nextRep,
          actorId: nextAct,
          statusBefore: draftStatusBefore.trim().slice(0, ADMIN_MOD_CASES_STATUS_BEFORE_MAX),
          statusAfter: draftStatusAfter.trim().slice(0, ADMIN_MOD_CASES_STATUS_AFTER_MAX),
        }),
      );
    },
    [router, draftLimit, draftReportId, draftActorId, draftStatusBefore, draftStatusAfter],
  );

  const clearNonLimitFilters = useCallback(() => {
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : listQ.limit;
    router.push(
      buildModerationCasesPath({
        limit: nextLimit,
        reportId: "",
        actorId: "",
        statusBefore: "",
        statusAfter: "",
      }),
    );
  }, [router, draftLimit, listQ.limit]);

  const hasExtraFilters =
    Boolean(listQ.reportId) ||
    Boolean(listQ.actorId) ||
    Boolean(listQ.statusBefore) ||
    Boolean(listQ.statusAfter);

  return {
    listQ,
    loading,
    refreshing,
    error,
    items,
    meta,
    appliedFilters,
    draftLimit,
    setDraftLimit,
    draftReportId,
    setDraftReportId,
    draftActorId,
    setDraftActorId,
    draftStatusBefore,
    setDraftStatusBefore,
    draftStatusAfter,
    setDraftStatusAfter,
    apply,
    clearNonLimitFilters,
    hasExtraFilters,
  };
}
