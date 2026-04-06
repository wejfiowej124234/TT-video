"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useState, type FormEvent } from "react";

import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminMetaBuildSection, isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { useTranslation } from "@/components/LocaleProvider";
import {
  type AdminFetchErrorKind,
  adminApiErrorUserText,
  adminErrorUserText,
  adminFetchErrorKind,
  adminFetchJson,
  adminLogApiJsonStatus,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders, writeRequestHeaders } from "@/lib/apiClient";
import { isUuidString } from "@/lib/isUuidString";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2WhiteClasses,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

type ReportRow = {
  id?: string;
  reporter_id?: string;
  target_type?: string;
  target_id?: string;
  reason_code?: string;
  details?: string | null;
  status?: string;
  version?: number;
  created_at?: string;
  updated_at?: string;
};

type ReportsRes = {
  status?: string;
  error?: string;
  items?: ReportRow[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

type ModerationRes = {
  status?: string;
  error?: string;
  current_version?: number;
  item?: { penalty_id?: string; version?: number };
};

const STATUS_OPTIONS = ["", "open", "in_review", "resolved", "dismissed"] as const;
const STATUS_URL = new Set(["open", "in_review", "resolved", "dismissed"]);
const TT_MAX = 64;
const RC_MAX = 128;
const MOD_STATUS_OPTIONS = ["open", "in_review", "resolved", "dismissed"] as const;
const PENALTY_ACTIONS = [
  "warn",
  "limit_feed",
  "mute",
  "ban",
  "shadow_ban",
  "content_remove",
  "other",
] as const;

type ReportsListParsed = {
  limit: number;
  status: string;
  reporterId: string;
  targetType: string;
  reasonCode: string;
  targetId: string;
};

function parseReportsListQuery(sp: URLSearchParams): ReportsListParsed {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const rawSt = (sp.get("status") ?? "").trim();
  const status = STATUS_URL.has(rawSt) ? rawSt : "";
  const rep = (sp.get("reporter_id") ?? "").trim();
  const reporterId = isUuidString(rep) ? rep : "";
  const targetType = (sp.get("target_type") ?? "").trim().slice(0, TT_MAX);
  const reasonCode = (sp.get("reason_code") ?? "").trim().slice(0, RC_MAX);
  const tid = (sp.get("target_id") ?? "").trim();
  const targetId = isUuidString(tid) ? tid : "";
  return { limit, status, reporterId, targetType, reasonCode, targetId };
}

function buildReportsListPath(q: ReportsListParsed): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  if (STATUS_URL.has(q.status)) sp.set("status", q.status);
  if (q.reporterId && isUuidString(q.reporterId)) sp.set("reporter_id", q.reporterId.trim());
  const tt = q.targetType.trim().slice(0, TT_MAX);
  if (tt) sp.set("target_type", tt);
  const rc = q.reasonCode.trim().slice(0, RC_MAX);
  if (rc) sp.set("reason_code", rc);
  if (q.targetId && isUuidString(q.targetId)) sp.set("target_id", q.targetId.trim());
  return `/admin/community/reports?${sp.toString()}`;
}

function moderationErrText(
  code: string | undefined,
  body: ModerationRes | undefined,
  t: (k: string) => string,
): string {
  switch (code) {
    case "community_report_version_conflict": {
      const cv = body?.current_version;
      return typeof cv === "number"
        ? t("admin_reports_modErrVersionConflict").replace("{{v}}", String(cv))
        : t("admin_reports_modErrVersionConflictGeneric");
    }
    case "admin_community_moderation_race":
      return t("admin_reports_modErrRace");
    case "community_penalty_only_when_resolved":
      return t("admin_reports_modErrPenaltyResolved");
    case "invalid_community_penalty_action":
      return t("admin_reports_modErrBadPenaltyAction");
    case "penalty_subject_required":
      return t("admin_reports_modErrPenaltySubject");
    case "invalid_penalty_subject_user_id":
      return t("admin_reports_modErrBadSubject");
    case "invalid_penalty_expires_at":
      return t("admin_reports_modErrBadExpires");
    default:
      return adminApiErrorUserText(code, t);
  }
}

/** 160 / 70：社区举报工单 + 审核 PATCH（须 admin + DB）。 */
function AdminCommunityReportsPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const modDialogTitleId = useId();
  const modDialogDescId = useId();
  const modModalFilterHintId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const listQ = useMemo(
    () => parseReportsListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<ReportRow[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);
  const [draftLimit, setDraftLimit] = useState(String(listQ.limit));
  const [draftStatus, setDraftStatus] = useState(listQ.status);
  const [draftReporterId, setDraftReporterId] = useState(listQ.reporterId);
  const [draftTargetType, setDraftTargetType] = useState(listQ.targetType);
  const [draftReasonCode, setDraftReasonCode] = useState(listQ.reasonCode);
  const [draftTargetId, setDraftTargetId] = useState(listQ.targetId);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    setDraftLimit(String(listQ.limit));
    setDraftStatus(listQ.status);
    setDraftReporterId(listQ.reporterId);
    setDraftTargetType(listQ.targetType);
    setDraftReasonCode(listQ.reasonCode);
    setDraftTargetId(listQ.targetId);
  }, [listQ]);

  const [modRow, setModRow] = useState<ReportRow | null>(null);
  const [modExpectedVer, setModExpectedVer] = useState("");
  const [modStatus, setModStatus] = useState<(typeof MOD_STATUS_OPTIONS)[number]>("in_review");
  const [modNotes, setModNotes] = useState("");
  const [modDisposition, setModDisposition] = useState("");
  const [modRecordPenalty, setModRecordPenalty] = useState(false);
  const [modPenaltyAction, setModPenaltyAction] = useState<(typeof PENALTY_ACTIONS)[number]>("warn");
  const [modPenaltySubject, setModPenaltySubject] = useState("");
  const [modPenaltyReason, setModPenaltyReason] = useState("");
  const [modPenaltyExpires, setModPenaltyExpires] = useState("");
  const [modSubmitting, setModSubmitting] = useState(false);
  const [modError, setModError] = useState<string | null>(null);

  const closeMod = useCallback(() => {
    setModRow(null);
    setModError(null);
  }, []);

  const openMod = (r: ReportRow) => {
    setModError(null);
    setModRow(r);
    const st = r.status?.trim();
    setModStatus(
      st && (MOD_STATUS_OPTIONS as readonly string[]).includes(st)
        ? (st as (typeof MOD_STATUS_OPTIONS)[number])
        : "in_review",
    );
    setModExpectedVer(r.version != null ? String(r.version) : "");
    setModNotes("");
    setModDisposition("");
    setModRecordPenalty(false);
    setModPenaltyAction("warn");
    setModPenaltySubject("");
    setModPenaltyReason("");
    setModPenaltyExpires("");
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);

    const limit = listQ.limit;

    const headers: Record<string, string> = { "x-request-id": `admin-community-reports-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403 below
    }

    const path = routes.admin.communityReports({
      limit,
      ...(listQ.status ? { status: listQ.status } : {}),
      ...(listQ.reporterId ? { reporter_id: listQ.reporterId } : {}),
      ...(listQ.targetType ? { target_type: listQ.targetType } : {}),
      ...(listQ.reasonCode ? { reason_code: listQ.reasonCode } : {}),
      ...(listQ.targetId ? { target_id: listQ.targetId } : {}),
    });

    adminFetchJson<ReportsRes>("AdminCommunityReportsPage", apiUrl(path), { headers })
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
        logAdminFetch("AdminCommunityReportsPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [listQ, reloadTick]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    const st = draftStatus.trim();
    const nextStatus = STATUS_URL.has(st) ? st : "";
    const repTrim = draftReporterId.trim();
    const nextReporter = isUuidString(repTrim) ? repTrim : "";
    const nextTt = draftTargetType.trim().slice(0, TT_MAX);
    const nextRc = draftReasonCode.trim().slice(0, RC_MAX);
    const tidTrim = draftTargetId.trim();
    const nextTid = isUuidString(tidTrim) ? tidTrim : "";
    router.push(
      buildReportsListPath({
        limit: nextLimit,
        status: nextStatus,
        reporterId: nextReporter,
        targetType: nextTt,
        reasonCode: nextRc,
        targetId: nextTid,
      }),
    );
  };

  const resetExtraFilters = () => {
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : listQ.limit;
    const st = draftStatus.trim();
    router.push(
      buildReportsListPath({
        limit: nextLimit,
        status: STATUS_URL.has(st) ? st : "",
        reporterId: "",
        targetType: "",
        reasonCode: "",
        targetId: "",
      }),
    );
  };

  const hasExtraFilters =
    Boolean(listQ.reporterId) ||
    Boolean(listQ.targetType) ||
    Boolean(listQ.reasonCode) ||
    Boolean(listQ.targetId);

  const submitModeration = useCallback(() => {
    const rid = modRow?.id?.trim();
    if (!rid) return;
    const ev = Number.parseInt(modExpectedVer.trim(), 10);
    if (!Number.isFinite(ev)) {
      setModError(t("admin_reports_modBadVer"));
      return;
    }
    setModSubmitting(true);
    setModError(null);

    let headers: Record<string, string>;
    try {
      headers = {
        ...writeRequestHeaders(),
        "Content-Type": "application/json",
      };
    } catch {
      setModError(t("admin_policies_publishAuth"));
      setModSubmitting(false);
      return;
    }

    const body: Record<string, unknown> = {
      expected_version: ev,
      status: modStatus.trim(),
    };
    if (modNotes.trim()) body.admin_notes = modNotes.trim();
    if (modDisposition.trim()) body.disposition = modDisposition.trim();
    if (modRecordPenalty && modStatus === "resolved") {
      const rp: Record<string, unknown> = { action: modPenaltyAction.trim() };
      if (modPenaltySubject.trim()) rp.subject_user_id = modPenaltySubject.trim();
      if (modPenaltyReason.trim()) rp.reason = modPenaltyReason.trim();
      if (modPenaltyExpires.trim()) rp.expires_at = modPenaltyExpires.trim();
      body.record_penalty = rp;
    }

    void adminFetchJson<ModerationRes>(
      "AdminCommunityModerationPatch",
      apiUrl(routes.admin.communityModeration(rid)),
      { method: "PATCH", headers, body: JSON.stringify(body) },
    )
      .then(({ res, body: b }) => {
        const err = typeof b?.error === "string" ? b.error : undefined;
        if (res.status === 409 && (err === "community_report_version_conflict" || err === "admin_community_moderation_race")) {
          setModError(moderationErrText(err, b, t));
          return;
        }
        if (res.status === 400 && err) {
          setModError(moderationErrText(err, b, t));
          return;
        }
        if (!res.ok) {
          throw new Error(`request_failed_${res.status}`);
        }
        if (b.status !== "ok") {
          adminLogApiJsonStatus("AdminCommunityModerationPatch", b);
          throw new Error(typeof b.error === "string" ? b.error : "request_failed");
        }
        setReloadTick((x) => x + 1);
        closeMod();
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminCommunityModerationPatch", e);
        const msg = e instanceof Error ? e.message : "";
        setModError(adminApiErrorUserText(msg.trim() || undefined, t));
      })
      .finally(() => setModSubmitting(false));
  }, [
    closeMod,
    modDisposition,
    modExpectedVer,
    modNotes,
    modPenaltyAction,
    modPenaltyExpires,
    modPenaltyReason,
    modPenaltySubject,
    modRecordPenalty,
    modRow,
    modStatus,
    t,
  ]);

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_community_reports_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_community_reports_subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-small">
          <Link href="/admin/community/moderation/cases" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_community_reports_linkModCases")}
          </Link>
          <Link href="/admin/community/risk-signals" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_community_reports_linkRisk")}
          </Link>
          <Link href="/admin/community/policy-change-logs" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_community_reports_linkPolicy")}
          </Link>
          <Link href="/admin/community/abuse-policy" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_community_reports_linkAbusePolicy")}
          </Link>
          <Link href="/admin/community/comments/visibility" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_community_reports_linkCommentVis")}
          </Link>
          <Link href="/admin/community/ranking/snapshots" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_community_reports_linkRanking")}
          </Link>
          <Link href="/admin/community/penalties" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_community_reports_linkPenalties")}
          </Link>
          <Link href="/admin/community/appeals" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_community_reports_linkAppeals")}
          </Link>
          <Link href="/admin/community/appeals/review" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_community_reports_linkAppealReview")}
          </Link>
          <Link
            href="/admin/observability"
            className={`${touchTargetLink44Classes} font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_community_reports_back")}
          </Link>
        </div>
      </header>

      <div className="mt-5 rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4 space-y-3">
        <form
          id="admin-community-reports-filter-form"
          aria-label={t("admin_community_reports_filters")}
          aria-describedby={
            [adminListApplyResetHintId, !loading && !error && appliedFilters ? adminAppliedFiltersDescId : ""]
              .filter(Boolean)
              .join(" ")
          }
          onSubmit={apply}
          className="flex flex-col gap-3"
        >
          <p className="text-small font-medium text-ink-800">{t("admin_community_reports_filters")}</p>
          <p id={adminListApplyResetHintId} className="text-meta text-ink-600 leading-relaxed">
            {t("admin_list_filters_apply_reset_hint")}
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-small text-ink-700">
              {t("admin_community_reports_limit")}
              <input
                type="text"
                inputMode="numeric"
                value={draftLimit}
                onChange={(e) => setDraftLimit(e.target.value)}
                className={`ml-2 min-h-[44px] w-20 rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 ${travelFocusRingCoreOffset2WhiteClasses}`}
              />
            </label>
            <label className="text-small text-ink-700">
              {t("admin_community_reports_status")}
              <select
                value={draftStatus}
                onChange={(e) => setDraftStatus(e.target.value)}
                className={`ml-2 inline-flex min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                {STATUS_OPTIONS.map((v) => (
                  <option key={v || "all"} value={v}>
                    {v === "" ? t("admin_community_reports_statusAll") : v}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-small text-ink-700 block min-w-[12rem]">
              {t("admin_community_reports_reporter_id")}
              <input
                type="text"
                value={draftReporterId}
                onChange={(e) => setDraftReporterId(e.target.value)}
                className={`mt-1 block w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
                placeholder={t("admin_community_reports_reporter_id_ph")}
                autoComplete="off"
              />
            </label>
            <label className="text-small text-ink-700 block min-w-[8rem]">
              {t("admin_community_reports_target_type")}
              <input
                type="text"
                value={draftTargetType}
                onChange={(e) => setDraftTargetType(e.target.value.slice(0, TT_MAX))}
                className={`mt-1 block w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
                placeholder={t("admin_community_reports_target_type_ph")}
                autoComplete="off"
              />
            </label>
            <label className="text-small text-ink-700 block min-w-[10rem]">
              {t("admin_community_reports_reason_code")}
              <input
                type="text"
                value={draftReasonCode}
                onChange={(e) => setDraftReasonCode(e.target.value.slice(0, RC_MAX))}
                className={`mt-1 block w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
                placeholder={t("admin_community_reports_reason_code_ph")}
                autoComplete="off"
              />
            </label>
            <label className="text-small text-ink-700 block min-w-[12rem]">
              {t("admin_community_reports_target_id")}
              <input
                type="text"
                value={draftTargetId}
                onChange={(e) => setDraftTargetId(e.target.value)}
                className={`mt-1 block w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
                placeholder={t("admin_community_reports_target_id_ph")}
                autoComplete="off"
              />
            </label>
          </div>
        </form>
        <div className="flex flex-wrap gap-2">
          <button
            form="admin-community-reports-filter-form"
            type="submit"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
          >
            {t("admin_community_reports_apply")}
          </button>
          {hasExtraFilters ? (
            <form
              className="inline"
              aria-describedby={adminListApplyResetHintId}
              onSubmit={(e) => {
                e.preventDefault();
                resetExtraFilters();
              }}
            >
              <button
                type="submit"
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-4 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                {t("admin_community_reports_clear_extra")}
              </button>
            </form>
          ) : null}
        </div>
      </div>

      {!loading && !error && appliedFilters ? (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="card" className="mt-6">
          {t("admin_community_reports_applied")}: {JSON.stringify(appliedFilters)}
        </AdminAppliedFiltersBanner>
      ) : null}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {loading && (
        <p className="mt-6 text-body text-ink-500" role="status">
          {t("admin_community_reports_loading")}
        </p>
      )}

      {error && (
        <p className="mt-6 rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
          {adminErrorUserText(error, t)}
        </p>
      )}

      {!loading && !error && (
        <section
          className="mt-6 overflow-x-auto rounded-[var(--radius-xl)] border border-ink-200 bg-white"
          aria-label={t("admin_community_reports_table_aria")}
        >
          <table className="min-w-full divide-y divide-ink-100 text-left text-small">
            <thead className="bg-bg-console text-ink-700">
              <tr>
                <th className="px-3 py-3 font-medium">{t("admin_community_reports_colStatus")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_community_reports_colTarget")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_community_reports_colReason")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_community_reports_colDetails")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_community_reports_colReporter")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_community_reports_colCreated")}</th>
                <th className="px-3 py-3 font-medium">v</th>
                <th className="px-3 py-3 font-medium">{t("admin_reports_colModerate")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 text-ink-700">
              {items.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-ink-500" colSpan={8}>
                    {t("admin_community_reports_empty")}
                  </td>
                </tr>
              )}
              {items.map((r, idx) => {
                const dash = t("admin_em_dash");
                const details = r.details?.trim() || dash;
                return (
                  <tr key={r.id ?? `report-${idx}`}>
                    <td className="px-3 py-2 font-mono text-meta">{r.status ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta max-w-[10rem]">
                      <span className="block truncate" title={`${r.target_type ?? ""} ${r.target_id ?? ""}`}>
                        {r.target_type ?? dash} / {r.target_id ?? dash}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-meta">{r.reason_code ?? dash}</td>
                    <td className="px-3 py-2 max-w-xs">
                      <span className="block truncate" title={details}>
                        {details}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-meta max-w-[8rem] truncate" title={r.reporter_id}>
                      {r.reporter_id ?? dash}
                    </td>
                    <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">{r.created_at ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta">{r.version ?? dash}</td>
                    <td className="px-3 py-2">
                      {r.id ? (
                        <form
                          className="inline"
                          onSubmit={(e) => {
                            e.preventDefault();
                            openMod(r);
                          }}
                        >
                          <button
                            type="submit"
                            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-200 bg-white px-2 py-1 text-meta hover:border-travel-400 ${travelFocusRingCoreOffset2WhiteClasses}`}
                          >
                            {t("admin_reports_moderate")}
                          </button>
                        </form>
                      ) : (
                        dash
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {modRow ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby={modDialogTitleId}
          aria-describedby={modDialogDescId}
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[var(--radius-xl)] border border-ink-200 bg-white p-5 shadow-medium">
            <h2 id={modDialogTitleId} className="text-body-l font-semibold text-ink-900">
              {t("admin_reports_modTitle")}
            </h2>
            <p id={modDialogDescId} className="mt-1 text-meta font-mono text-ink-600 break-all">{modRow.id}</p>
            <p id={modModalFilterHintId} className="mt-2 text-meta text-ink-600 leading-relaxed">
              {t("admin_reports_mod_filter_hint")}
            </p>

            <form
              aria-describedby={modModalFilterHintId}
              className="mt-4 space-y-3 text-small"
              onSubmit={(e) => {
                e.preventDefault();
                const sub = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
                if (sub?.name === "admin_modal_intent" && sub.value === "cancel") {
                  closeMod();
                  return;
                }
                submitModeration();
              }}
            >
              <label className="block text-ink-700">
                {t("admin_reports_modExpectedVer")}
                <input
                  type="text"
                  name="expected_version"
                  inputMode="numeric"
                  value={modExpectedVer}
                  onChange={(e) => setModExpectedVer(e.target.value)}
                  className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono ${travelFocusRingCoreOffset2WhiteClasses}`}
                />
              </label>
              <label className="block text-ink-700">
                {t("admin_reports_modStatus")}
                <select
                  name="status"
                  value={modStatus}
                  onChange={(e) => setModStatus(e.target.value as (typeof MOD_STATUS_OPTIONS)[number])}
                  className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 ${travelFocusRingCoreOffset2WhiteClasses}`}
                >
                  {MOD_STATUS_OPTIONS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-ink-700">
                {t("admin_reports_modNotes")}
                <textarea
                  name="admin_notes"
                  value={modNotes}
                  onChange={(e) => setModNotes(e.target.value)}
                  rows={2}
                  className={`mt-1 w-full min-h-[80px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-2 text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
                />
              </label>
              <label className="block text-ink-700">
                {t("admin_reports_modDisposition")}
                <input
                  type="text"
                  name="disposition"
                  value={modDisposition}
                  onChange={(e) => setModDisposition(e.target.value)}
                  className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 ${travelFocusRingCoreOffset2WhiteClasses}`}
                />
              </label>

              <div className="rounded-[var(--radius-md)] border border-ink-100 bg-bg-console p-3 space-y-2">
                <label className="flex items-center gap-2 text-ink-800">
                  <input
                    type="checkbox"
                    name="record_penalty"
                    checked={modRecordPenalty}
                    onChange={(e) => setModRecordPenalty(e.target.checked)}
                  />
                  {t("admin_reports_modRecordPenalty")}
                </label>
                <p className="text-meta text-ink-500">{t("admin_reports_modRecordPenaltyHint")}</p>
                {modRecordPenalty ? (
                  <>
                    <label className="block text-ink-700">
                      {t("admin_reports_modPenaltyAction")}
                      <select
                        name="penalty_action"
                        value={modPenaltyAction}
                        onChange={(e) =>
                          setModPenaltyAction(e.target.value as (typeof PENALTY_ACTIONS)[number])
                        }
                        className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono ${travelFocusRingCoreOffset2WhiteClasses}`}
                      >
                        {PENALTY_ACTIONS.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-ink-700">
                      {t("admin_reports_modPenaltySubject")}
                      <input
                        type="text"
                        name="penalty_subject_user_id"
                        value={modPenaltySubject}
                        onChange={(e) => setModPenaltySubject(e.target.value)}
                        className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-meta ${travelFocusRingCoreOffset2WhiteClasses}`}
                        placeholder={t("admin_reports_modPenaltySubjectPh")}
                        autoComplete="off"
                      />
                    </label>
                    <label className="block text-ink-700">
                      {t("admin_reports_modPenaltyReason")}
                      <input
                        type="text"
                        name="penalty_reason"
                        value={modPenaltyReason}
                        onChange={(e) => setModPenaltyReason(e.target.value)}
                        className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 ${travelFocusRingCoreOffset2WhiteClasses}`}
                      />
                    </label>
                    <label className="block text-ink-700">
                      {t("admin_reports_modPenaltyExpires")}
                      <input
                        type="text"
                        name="penalty_expires_at"
                        value={modPenaltyExpires}
                        onChange={(e) => setModPenaltyExpires(e.target.value)}
                        className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-meta ${travelFocusRingCoreOffset2WhiteClasses}`}
                        placeholder={t("admin_reports_modPenaltyExpiresPh")}
                        autoComplete="off"
                      />
                    </label>
                  </>
                ) : null}
              </div>

            {modError ? (
              <p className="mt-3 rounded-[var(--radius-sm)] border border-danger/20 bg-danger/5 p-2 text-small text-danger" role="alert">
                {modError}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="submit"
                name="admin_modal_intent"
                value="cancel"
                formNoValidate
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-200 bg-white px-4 py-2 text-small font-medium text-ink-800 hover:bg-bg-console ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                {t("admin_reports_modCancel")}
              </button>
              <button
                type="submit"
                disabled={modSubmitting}
                aria-busy={modSubmitting ? true : undefined}
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-600 disabled:opacity-60 ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                {modSubmitting ? t("admin_reports_modSubmitting") : t("admin_reports_modSubmit")}
              </button>
            </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default function AdminCommunityReportsPage() {
  return (
    <AdminSearchParamsSuspense
      ariaLabelKey="admin_community_reports_title"
      backLinkLabelKey="admin_community_reports_back"
    >
      <AdminCommunityReportsPageInner />
    </AdminSearchParamsSuspense>
  );
}
