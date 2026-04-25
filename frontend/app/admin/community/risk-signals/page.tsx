"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useId, useMemo, useState } from "react";

import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminMetaBuildSection, isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { useTranslation } from "@/components/LocaleProvider";
import {
  type AdminFetchErrorKind,
  adminErrorUserText,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";
import { isUuidString } from "@/lib/isUuidString";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2WhiteClasses,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

type Row = {
  id?: string;
  subject_user_id?: string;
  signal_type?: string;
  rule_id?: string | null;
  severity?: string | number | null;
  context?: unknown;
  created_at?: string;
};

type Res = {
  status?: string;
  error?: string;
  items?: Row[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

const ST_MAX = 128;
const RID_MAX = 128;
const SEV_MAX = 64;

function contextPreview(c: unknown, dash: string): string {
  if (c == null) return dash;
  try {
    const s = typeof c === "string" ? c : JSON.stringify(c);
    return s.length > 96 ? `${s.slice(0, 96)}…` : s;
  } catch {
    return dash;
  }
}

function parseRiskSignalsQuery(sp: URLSearchParams): {
  limit: number;
  subjectUserId: string;
  signalType: string;
  ruleId: string;
  severity: string;
} {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const rawS = (sp.get("subject_user_id") ?? "").trim();
  const subjectUserId = isUuidString(rawS) ? rawS : "";
  const signalType = (sp.get("signal_type") ?? "").trim().slice(0, ST_MAX);
  const ruleId = (sp.get("rule_id") ?? "").trim().slice(0, RID_MAX);
  const severity = (sp.get("severity") ?? "").trim().slice(0, SEV_MAX);
  return { limit, subjectUserId, signalType, ruleId, severity };
}

function buildRiskSignalsPath(q: {
  limit: number;
  subjectUserId: string;
  signalType: string;
  ruleId: string;
  severity: string;
}): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  if (q.subjectUserId && isUuidString(q.subjectUserId)) sp.set("subject_user_id", q.subjectUserId.trim());
  const st = q.signalType.trim().slice(0, ST_MAX);
  if (st) sp.set("signal_type", st);
  const rid = q.ruleId.trim().slice(0, RID_MAX);
  if (rid) sp.set("rule_id", rid);
  const sev = q.severity.trim().slice(0, SEV_MAX);
  if (sev) sp.set("severity", sev);
  return `/admin/community/risk-signals?${sp.toString()}`;
}

/** 160 §5：社区风险信号只读（须 admin + DB）。 */
function AdminCommunityRiskSignalsPageInner() {
  const { t } = useTranslation();
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
  const [items, setItems] = useState<Row[]>([]);
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

    adminFetchJson<Res>("AdminCommunityRiskSignalsPage", apiUrl(path), { headers })
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
        signalType: draftSignalType.trim().slice(0, ST_MAX),
        ruleId: draftRuleId.trim().slice(0, RID_MAX),
        severity: draftSeverity.trim().slice(0, SEV_MAX),
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

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_risk_signals_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_risk_signals_subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-small">
          <Link
            href="/admin/observability"
            className={`${touchTargetLink44Classes} font-medium text-travel-600 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${touchTargetLink44Classes} text-travel-500 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}>
            {t("admin_risk_signals_back")}
          </Link>
        </div>
      </header>

      <div className="mt-6 rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4 space-y-3">
        <form
          id="admin-risk-signals-filter-form"
          className="space-y-3"
          aria-label={t("admin_risk_signals_filters")}
          aria-describedby={
            [adminListApplyResetHintId, appliedFilters ? adminAppliedFiltersDescId : ""].filter(Boolean).join(" ")
          }
          onSubmit={apply}
        >
          <p id={adminListApplyResetHintId} className="text-meta text-ink-600 leading-relaxed">
            {t("admin_list_filters_apply_reset_hint")}
          </p>
        <p className="text-small font-medium text-ink-800">{t("admin_risk_signals_filters")}</p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-small text-ink-700">
            {t("admin_risk_signals_limit")}
            <input
              type="text"
              inputMode="numeric"
              value={draftLimit}
              onChange={(e) => setDraftLimit(e.target.value)}
              className={`ml-2 min-h-[44px] w-20 rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 ${travelFocusRingCoreOffset2WhiteClasses}`}
            />
          </label>
          <label className="text-small text-ink-700 min-w-[10rem] flex-1">
            {t("admin_risk_signals_subject")}
            <input
              type="text"
              value={draftSubject}
              onChange={(e) => setDraftSubject(e.target.value)}
              className={`ml-2 w-full max-w-md min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-meta ${travelFocusRingCoreOffset2WhiteClasses}`}
              placeholder={t("admin_risk_signals_subjectPh")}
              autoComplete="off"
            />
          </label>
          <label className="text-small text-ink-700 min-w-[8rem] flex-1">
            {t("admin_risk_signals_signalType")}
            <input
              type="text"
              value={draftSignalType}
              onChange={(e) => setDraftSignalType(e.target.value.slice(0, ST_MAX))}
              className={`mt-1 block w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
              placeholder={t("admin_risk_signals_signalTypePh")}
              autoComplete="off"
            />
          </label>
          <label className="text-small text-ink-700 min-w-[8rem] flex-1">
            {t("admin_risk_signals_ruleId")}
            <input
              type="text"
              value={draftRuleId}
              onChange={(e) => setDraftRuleId(e.target.value.slice(0, RID_MAX))}
              className={`mt-1 block w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
              placeholder={t("admin_risk_signals_ruleIdPh")}
              autoComplete="off"
            />
          </label>
          <label className="text-small text-ink-700 min-w-[6rem] flex-1">
            {t("admin_risk_signals_severity")}
            <input
              type="text"
              value={draftSeverity}
              onChange={(e) => setDraftSeverity(e.target.value.slice(0, SEV_MAX))}
              className={`mt-1 block w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
              placeholder={t("admin_risk_signals_severityPh")}
              autoComplete="off"
            />
          </label>
        </div>
        </form>
        <div className="flex flex-wrap gap-2">
          <button
            form="admin-risk-signals-filter-form"
            type="submit"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
          >
            {t("admin_risk_signals_apply")}
          </button>
          {hasTextFilters ? (
            <form
              className="inline"
              aria-describedby={adminListApplyResetHintId}
              onSubmit={(e) => {
                e.preventDefault();
                clearNonLimitFilters();
              }}
            >
              <button
                type="submit"
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-2 text-small text-ink-700 hover:bg-ink-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                {t("admin_risk_signals_clear_filters")}
              </button>
            </form>
          ) : null}
        </div>
        {appliedFilters ? (
          <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="inline">
            {t("admin_risk_signals_applied")}
            {t("market_fin_colon")}
            {JSON.stringify(appliedFilters)}
          </AdminAppliedFiltersBanner>
        ) : null}
      </div>

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {loading && (
        <p className="mt-6 text-body text-ink-500" role="status">
          {t("admin_risk_signals_loading")}
        </p>
      )}
      {error && (
        <p className="mt-6 rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
          {adminErrorUserText(error, t)}
        </p>
      )}

      {!loading && !error && (
        <section className="mt-6 overflow-x-auto rounded-[var(--radius-xl)] border border-ink-200 bg-white" aria-label={t("admin_risk_signals_table_aria")}>
          <table className="min-w-full divide-y divide-ink-100 text-left text-small">
            <thead className="bg-bg-console text-ink-700">
              <tr>
                <th className="px-3 py-3 font-medium">{t("admin_risk_signals_colTime")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_risk_signals_colSubject")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_risk_signals_colType")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_risk_signals_colRule")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_risk_signals_colSev")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_risk_signals_colCtx")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 text-ink-700">
              {items.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-ink-500" colSpan={6}>
                    {t("admin_risk_signals_empty")}
                  </td>
                </tr>
              )}
              {items.map((r, idx) => {
                const dash = t("admin_em_dash");
                const ctx = contextPreview(r.context, dash);
                return (
                  <tr key={r.id ?? `rs-${idx}`}>
                    <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">{r.created_at ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta max-w-[9rem] truncate" title={r.subject_user_id}>
                      {r.subject_user_id ?? dash}
                    </td>
                    <td className="px-3 py-2 font-mono text-meta">{r.signal_type ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta">{r.rule_id ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta">{r.severity ?? dash}</td>
                    <td className="px-3 py-2 max-w-md font-mono text-meta">
                      <span className="block truncate" title={ctx}>
                        {ctx}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}

export default function AdminCommunityRiskSignalsPage() {
  return (
    <AdminSearchParamsSuspense
      ariaLabelKey="admin_risk_signals_title"
      backLinkLabelKey="admin_risk_signals_back"
    >
      <AdminCommunityRiskSignalsPageInner />
    </AdminSearchParamsSuspense>
  );
}
