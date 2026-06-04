// search-params gate: parent route provides Suspense boundary.
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type Dispatch, type FormEvent, type SetStateAction, useEffect, useId, useMemo, useState } from "react";

import { isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import {
  type AdminFetchErrorKind,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";
import { isUuidString } from "@/lib/isUuidString";
import {
  ADMIN_RISK_SIGNALS_RID_MAX,
  ADMIN_RISK_SIGNALS_SEV_MAX,
  ADMIN_RISK_SIGNALS_ST_MAX,
  type AdminRiskSignalRow,
  type AdminRiskSignalsResponse,
  buildRiskSignalsPath,
  parseRiskSignalsQuery,
} from "./adminRiskSignalsPageModel";

export type AdminCommunityRiskSignalsPageViewModel = {
  pageTitleId: string;
  adminAppliedFiltersDescId: string;
  adminListApplyResetHintId: string;
  listQ: ReturnType<typeof parseRiskSignalsQuery>;
  loading: boolean;
  error: AdminFetchErrorKind | null;
  items: AdminRiskSignalRow[];
  meta: Record<string, unknown> | null;
  appliedFilters: Record<string, unknown> | null;
  draftLimit: string;
  setDraftLimit: Dispatch<SetStateAction<string>>;
  draftSubject: string;
  setDraftSubject: Dispatch<SetStateAction<string>>;
  draftSignalType: string;
  setDraftSignalType: Dispatch<SetStateAction<string>>;
  draftRuleId: string;
  setDraftRuleId: Dispatch<SetStateAction<string>>;
  draftSeverity: string;
  setDraftSeverity: Dispatch<SetStateAction<string>>;
  apply: (e?: FormEvent) => void;
  clearNonLimitFilters: () => void;
  hasTextFilters: boolean;
  stMax: number;
  ridMax: number;
  sevMax: number;
};

export function useAdminCommunityRiskSignalsPage(): AdminCommunityRiskSignalsPageViewModel {
  const pageTitleId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const listQ = useMemo(
    () => parseRiskSignalsQuery(new URLSearchParams(searchParams?.toString() ?? "")),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<AdminRiskSignalRow[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);
  const [draftLimit, setDraftLimit] = useState(String(listQ.limit));
  const [draftSubject, setDraftSubject] = useState(listQ.subjectUserId);
  const [draftSignalType, setDraftSignalType] = useState(listQ.signalType);
  const [draftRuleId, setDraftRuleId] = useState(listQ.ruleId);
  const [draftSeverity, setDraftSeverity] = useState(listQ.severity);

  useEffect(() => {
    setDraftLimit(String(listQ.limit));
    setDraftSubject(listQ.subjectUserId);
    setDraftSignalType(listQ.signalType);
    setDraftRuleId(listQ.ruleId);
    setDraftSeverity(listQ.severity);
  }, [listQ]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);

    const headers: Record<string, string> = { "x-request-id": `admin-risk-sig-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    const path = routes.admin.communityRiskSignals({
      limit: listQ.limit,
      subject_user_id: listQ.subjectUserId || undefined,
      signal_type: listQ.signalType || undefined,
      rule_id: listQ.ruleId || undefined,
      severity: listQ.severity || undefined,
    });

    adminFetchJson<AdminRiskSignalsResponse>("AdminCommunityRiskSignalsPage", apiUrl(path), { headers })
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
        logAdminFetch("AdminCommunityRiskSignalsPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [listQ]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    const sTrim = draftSubject.trim();
    const nextSub = isUuidString(sTrim) ? sTrim : "";
    router.push(
      buildRiskSignalsPath({
        limit: nextLimit,
        subjectUserId: nextSub,
        signalType: draftSignalType.trim().slice(0, ADMIN_RISK_SIGNALS_ST_MAX),
        ruleId: draftRuleId.trim().slice(0, ADMIN_RISK_SIGNALS_RID_MAX),
        severity: draftSeverity.trim().slice(0, ADMIN_RISK_SIGNALS_SEV_MAX),
      }),
    );
  };

  const clearNonLimitFilters = () => {
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : listQ.limit;
    router.push(
      buildRiskSignalsPath({
        limit: nextLimit,
        subjectUserId: "",
        signalType: "",
        ruleId: "",
        severity: "",
      }),
    );
  };

  const hasTextFilters =
    Boolean(listQ.subjectUserId) ||
    Boolean(listQ.signalType) ||
    Boolean(listQ.ruleId) ||
    Boolean(listQ.severity);

  return {
    pageTitleId,
    adminAppliedFiltersDescId,
    adminListApplyResetHintId,
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
    draftSignalType,
    setDraftSignalType,
    draftRuleId,
    setDraftRuleId,
    draftSeverity,
    setDraftSeverity,
    apply,
    clearNonLimitFilters,
    hasTextFilters,
    stMax: ADMIN_RISK_SIGNALS_ST_MAX,
    ridMax: ADMIN_RISK_SIGNALS_RID_MAX,
    sevMax: ADMIN_RISK_SIGNALS_SEV_MAX,
  };
}
