// search-params gate: parent route provides Suspense boundary.
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useState, type FormEvent } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import { useAdminFormErrorState } from "@/lib/admin/adminFormErrorState";
import {
  adminFetchErrorKind,
  adminFetchJson,
  adminLogApiJsonStatus,
  adminUserFacingErrorFromUnknown,
  logAdminFetch,
  type AdminFetchErrorKind,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders, writeRequestHeaders } from "@/lib/apiClient";
import { isUuidString } from "@/lib/isUuidString";
import {
  PENALTY_ACTIONS,
  PENALTY_STATUS_OPTIONS,
  PENALTY_STATUS_URL,
  type CommunityPenaltyAction,
} from "./adminCommunityPenaltiesPageConstants";
import { penaltyCreateErr } from "./adminCommunityPenaltiesPageHelpers";
import { buildPenaltiesListPath, parsePenaltiesListQuery } from "./adminCommunityPenaltiesPageQuery";
import type {
  AdminCommunityPenaltyCreateRes,
  AdminCommunityPenaltiesListRes,
  AdminCommunityPenaltyRow,
} from "./adminCommunityPenaltiesPageTypes";

export function useAdminCommunityPenaltiesPage() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const createDialogTitleId = useId();
  const createDialogDescId = useId();
  const createModalFilterHintId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const limitInputId = useId();
  const subjectInputId = useId();
  const reportIdInputId = useId();
  const statusSelectId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const listQ = useMemo(
    () => parsePenaltiesListQuery(new URLSearchParams(searchParams?.toString() ?? "")),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<AdminCommunityPenaltyRow[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);
  const [draftLimit, setDraftLimit] = useState(String(listQ.limit));
  const [draftSubject, setDraftSubject] = useState(listQ.subjectUserId);
  const [draftReportId, setDraftReportId] = useState(listQ.reportId);
  const [draftStatus, setDraftStatus] = useState(listQ.status);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    setDraftLimit(String(listQ.limit));
    setDraftSubject(listQ.subjectUserId);
    setDraftReportId(listQ.reportId);
    setDraftStatus(listQ.status);
  }, [listQ]);

  const [showCreate, setShowCreate] = useState(false);
  const [cSubject, setCSubject] = useState("");
  const [cAction, setCAction] = useState<CommunityPenaltyAction>("warn");
  const [cReportId, setCReportId] = useState("");
  const [cReason, setCReason] = useState("");
  const [cExpires, setCExpires] = useState("");
  const [cMetaJson, setCMetaJson] = useState("");
  const [cSubmitting, setCSubmitting] = useState(false);
  const createFormError = useAdminFormErrorState();

  const closeCreate = useCallback(() => {
    setShowCreate(false);
    createFormError.clearError();
  }, [createFormError]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);

    const headers: Record<string, string> = { "x-request-id": `admin-penalties-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    const path = routes.admin.communityPenalties({
      limit: listQ.limit,
      subject_user_id: listQ.subjectUserId || undefined,
      report_id: listQ.reportId || undefined,
      status: listQ.status || undefined,
    });

    adminFetchJson<AdminCommunityPenaltiesListRes>("AdminCommunityPenaltiesPage", apiUrl(path), { headers })
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
        logAdminFetch("AdminCommunityPenaltiesPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [listQ, reloadTick]);

  const apply = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      const n = Number.parseInt(draftLimit.trim(), 10);
      const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
      const sTrim = draftSubject.trim();
      const nextSub = isUuidString(sTrim) ? sTrim : "";
      const rTrim = draftReportId.trim();
      const nextRep = isUuidString(rTrim) ? rTrim : "";
      router.push(
        buildPenaltiesListPath({
          limit: nextLimit,
          subjectUserId: nextSub,
          reportId: nextRep,
          status: PENALTY_STATUS_URL.has(draftStatus) ? draftStatus : "",
        }),
      );
    },
    [draftLimit, draftReportId, draftStatus, draftSubject, router],
  );

  const resetFilters = useCallback(() => {
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : listQ.limit;
    router.push(buildPenaltiesListPath({ limit: nextLimit, subjectUserId: "", reportId: "", status: "" }));
  }, [draftLimit, listQ.limit, router]);

  const hasActiveFilters =
    Boolean(listQ.subjectUserId) || Boolean(listQ.reportId) || Boolean(listQ.status);

  const openCreate = useCallback(() => {
    createFormError.clearError();
    setCSubject("");
    setCAction("warn");
    setCReportId("");
    setCReason("");
    setCExpires("");
    setCMetaJson("");
    setShowCreate(true);
  }, []);

  const submitCreate = useCallback(() => {
    const sub = cSubject.trim();
    if (!sub) {
      createFormError.setError("invalid_request", t("admin_penalties_createNeedSubject"));
      return;
    }
    let metadata: unknown = undefined;
    const mj = cMetaJson.trim();
    if (mj) {
      try {
        metadata = JSON.parse(mj) as unknown;
      } catch {
        createFormError.setError("invalid_request", t("admin_penalties_createBadMeta"));
        return;
      }
    }
    setCSubmitting(true);
    createFormError.clearError();
    let headers: Record<string, string>;
    try {
      headers = { ...writeRequestHeaders(), "Content-Type": "application/json" };
    } catch {
      createFormError.setError("login_required", t("admin_policies_publishAuth"));
      setCSubmitting(false);
      return;
    }
    const body: Record<string, unknown> = {
      subject_user_id: sub,
      action: cAction.trim(),
    };
    const rep = cReportId.trim();
    if (rep) body.report_id = rep;
    if (cReason.trim()) body.reason = cReason.trim();
    if (cExpires.trim()) body.expires_at = cExpires.trim();
    if (metadata !== undefined) body.metadata = metadata;

    void adminFetchJson<AdminCommunityPenaltyCreateRes>(
      "AdminCommunityPenaltyCreate",
      apiUrl(routes.admin.communityPenaltyCreate),
      {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      },
    )
      .then(({ res, body: b }) => {
        const err = typeof b?.error === "string" ? b.error : undefined;
        if (res.status === 400 && err) {
          createFormError.setError("invalid_request", penaltyCreateErr(err, t));
          return;
        }
        if (!res.ok) {
          throw new Error(`request_failed_${res.status}`);
        }
        if (b.status !== "ok") {
          adminLogApiJsonStatus("AdminCommunityPenaltyCreate", b);
          throw new Error(typeof b.error === "string" ? b.error : "request_failed");
        }
        setReloadTick((x) => x + 1);
        closeCreate();
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminCommunityPenaltyCreate", e);
        const facing = adminUserFacingErrorFromUnknown(e, t);
        createFormError.setError(facing.kind, facing.message);
      })
      .finally(() => setCSubmitting(false));
  }, [cAction, cExpires, cMetaJson, cReason, cReportId, cSubject, closeCreate, t]);

  return {
    t,
    pageTitleId,
    createDialogTitleId,
    createDialogDescId,
    createModalFilterHintId,
    adminAppliedFiltersDescId,
    adminListApplyResetHintId,
    limitInputId,
    subjectInputId,
    reportIdInputId,
    statusSelectId,
    listQ,
    loading,
    error,
    items,
    meta,
    appliedFilters,
    draftLimit,
    setDraftLimit,
    draftSubject,
    setDraftSubject,
    draftReportId,
    setDraftReportId,
    draftStatus,
    setDraftStatus,
    apply,
    resetFilters,
    hasActiveFilters,
    showCreate,
    openCreate,
    closeCreate,
    submitCreate,
    cSubject,
    setCSubject,
    cAction,
    setCAction,
    cReportId,
    setCReportId,
    cReason,
    setCReason,
    cExpires,
    setCExpires,
    cMetaJson,
    setCMetaJson,
    cSubmitting,
    cError: createFormError.message,
    cErrorKind: createFormError.kind,
    penaltyStatusOptions: PENALTY_STATUS_OPTIONS,
    penaltyActions: PENALTY_ACTIONS,
  };
}

export type AdminCommunityPenaltiesPageViewModel = ReturnType<typeof useAdminCommunityPenaltiesPage>;
