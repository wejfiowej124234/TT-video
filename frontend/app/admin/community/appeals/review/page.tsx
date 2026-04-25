"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useId } from "react";

import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { useTranslation } from "@/components/LocaleProvider";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { useAdminMetaBuildFromPublicMeta } from "@/lib/useAdminMetaBuildFromPublicMeta";
import {
  adminApiErrorUserText,
  adminFetchJson,
  adminLogApiJsonStatus,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { writeRequestHeaders } from "@/lib/apiClient";
import type { LocaleTranslateFn } from "@/lib/i18n";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2WhiteClasses,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

const DECISIONS = ["accepted", "rejected"] as const;

const APPEAL_DECISION_I18N: Record<(typeof DECISIONS)[number], string> = {
  accepted: "admin_appeal_review_opt_accepted",
  rejected: "admin_appeal_review_opt_rejected",
};

type Res = {
  status?: string;
  error?: string;
  current_version?: number;
  item?: { id?: string; status?: string; version?: number };
};

function appealReviewErr(code: string | undefined, body: Res | undefined, t: LocaleTranslateFn): string {
  switch (code) {
    case "invalid_community_appeal_id":
      return t("admin_appeal_review_errBadId");
    case "invalid_community_appeal_decision":
      return t("admin_appeal_review_errBadDecision");
    case "community_appeal_not_found":
      return t("admin_appeal_review_errNotFound");
    case "community_appeal_not_pending":
      return t("admin_appeal_review_errNotPending");
    case "community_appeal_version_conflict": {
      const cv = body?.current_version;
      return typeof cv === "number"
        ? t("admin_appeal_review_errVersionConflict", { v: cv })
        : t("admin_appeal_review_errVersionConflictGeneric");
    }
    case "admin_community_appeal_review_race":
      return t("admin_appeal_review_errRace");
    default:
      return adminApiErrorUserText(code, t);
  }
}

/** 160：申诉复核 POST（须 super_admin + DB + 幂等键）。 */
function AdminCommunityAppealReviewPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const appealReviewFilterHintId = useId();
  const { meta: buildMeta, loading: buildLoading, error: buildError } =
    useAdminMetaBuildFromPublicMeta("AdminAppealReviewMetaBuild");
  const searchParams = useSearchParams();
  const [appealId, setAppealId] = useState("");
  const [expectedVersion, setExpectedVersion] = useState("");
  const [decision, setDecision] = useState<(typeof DECISIONS)[number]>("rejected");
  const [reviewerNote, setReviewerNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    const qId = searchParams.get("appeal_id")?.trim();
    const qVer = searchParams.get("expected_version")?.trim();
    if (qId) setAppealId(qId);
    if (qVer) setExpectedVersion(qVer);
  }, [searchParams]);

  const submit = useCallback(() => {
    const aid = appealId.trim();
    if (!aid) {
      setError(t("admin_appeal_review_needId"));
      return;
    }
    const ev = Number.parseInt(expectedVersion.trim(), 10);
    if (!Number.isFinite(ev)) {
      setError(t("admin_appeal_review_needVer"));
      return;
    }
    setSubmitting(true);
    setError(null);
    setOk(null);
    let headers: Record<string, string>;
    try {
      headers = { ...writeRequestHeaders(), "Content-Type": "application/json" };
    } catch {
      setError(t("admin_policies_publishAuth"));
      setSubmitting(false);
      return;
    }
    const payload: Record<string, unknown> = {
      expected_version: ev,
      decision: decision.trim(),
    };
    if (reviewerNote.trim()) payload.reviewer_note = reviewerNote.trim();

    void adminFetchJson<Res>(
      "AdminCommunityAppealReview",
      apiUrl(routes.admin.communityAppealReview(aid)),
      { method: "POST", headers, body: JSON.stringify(payload) },
    )
      .then(({ res, body: b }) => {
        const err = typeof b?.error === "string" ? b.error : undefined;
        if (res.status === 400 && err) {
          setError(appealReviewErr(err, b, t));
          return;
        }
        if (res.status === 404 && err) {
          setError(appealReviewErr(err, b, t));
          return;
        }
        if (res.status === 409 && err) {
          setError(appealReviewErr(err, b, t));
          return;
        }
        if (!res.ok) {
          throw new Error(`request_failed_${res.status}`);
        }
        if (b.status !== "ok") {
          adminLogApiJsonStatus("AdminCommunityAppealReview", b);
          throw new Error(typeof b.error === "string" ? b.error : "request_failed");
        }
        const st = b.item?.status ?? decision;
        const idOut = b.item?.id ?? aid;
        const stNorm = st === "accepted" || st === "rejected" ? st : null;
        const stLabel = stNorm ? t(APPEAL_DECISION_I18N[stNorm]) : st;
        setOk(t("admin_appeal_review_ok", { id: idOut, status: stLabel }));
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminCommunityAppealReview", e);
        const msg = e instanceof Error ? e.message : "";
        setError(adminApiErrorUserText(msg.trim() || undefined, t));
      })
      .finally(() => setSubmitting(false));
  }, [appealId, decision, expectedVersion, reviewerNote, t]);

  return (
    <main className="mx-auto max-w-5xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_appeal_review_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_appeal_review_subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-small">
          <Link href="/admin/community/appeals" className={`${touchTargetLink44Classes} text-travel-500 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}>
            {t("admin_appeals_linkLedger")}
          </Link>
          <Link href="/admin/community/reports" className={`${touchTargetLink44Classes} text-travel-500 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}>
            {t("admin_penalties_linkReports")}
          </Link>
          <Link
            href="/admin/observability"
            className={`${touchTargetLink44Classes} font-medium text-travel-600 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${touchTargetLink44Classes} text-travel-500 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}>
            {t("admin_community_reports_back")}
          </Link>
        </div>
      </header>

      <AdminMetaBuildSection meta={buildMeta} loading={buildLoading} error={buildError} />

      <section
        className="mt-6 rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4 space-y-4 max-w-md"
        aria-label={t("admin_appeal_review_form_aria")}
      >
        <p id={appealReviewFilterHintId} className="text-meta text-ink-600">
          {t("admin_appeal_review_filter_hint")}
        </p>
        <form
          className="space-y-4"
          aria-describedby={appealReviewFilterHintId}
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <label className="block text-small text-ink-700">
            {t("admin_appeal_review_appealId")}
            <input
              type="text"
              name="appeal_id"
              value={appealId}
              onChange={(e) => setAppealId(e.target.value)}
              className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-meta ${travelFocusRingCoreOffset2WhiteClasses}`}
              autoComplete="off"
            />
          </label>
          <label className="block text-small text-ink-700">
            {t("admin_appeal_review_expectedVer")}
            <input
              type="text"
              inputMode="numeric"
              name="expected_version"
              value={expectedVersion}
              onChange={(e) => setExpectedVersion(e.target.value)}
              className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-meta ${travelFocusRingCoreOffset2WhiteClasses}`}
            />
          </label>
          <label className="block text-small text-ink-700">
            {t("admin_appeal_review_decision")}
            <select
              name="decision"
              value={decision}
              onChange={(e) => setDecision(e.target.value as (typeof DECISIONS)[number])}
              className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono ${travelFocusRingCoreOffset2WhiteClasses}`}
            >
              {DECISIONS.map((d) => (
                <option key={d} value={d}>
                  {t(APPEAL_DECISION_I18N[d])}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-small text-ink-700">
            {t("admin_appeal_review_note")}
            <textarea
              name="reviewer_note"
              value={reviewerNote}
              onChange={(e) => setReviewerNote(e.target.value)}
              rows={3}
              className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 ${travelFocusRingCoreOffset2WhiteClasses}`}
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting ? true : undefined}
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-600 disabled:opacity-60 ${travelFocusRingCoreOffset2WhiteClasses}`}
          >
            {submitting ? t("admin_appeal_review_submitting") : t("admin_appeal_review_submit")}
          </button>
        </form>
      </section>

      {error ? (
        <p className="mt-4 rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {ok ? (
        <p className="mt-4 rounded-[var(--radius-md)] border border-success/25 bg-success/10 p-3 text-body text-success" role="status">
          {ok}
        </p>
      ) : null}
    </main>
  );
}

export default function AdminCommunityAppealReviewPage() {
  return (
    <AdminSearchParamsSuspense
      ariaLabelKey="admin_appeal_review_title"
      backLinkLabelKey="admin_community_reports_back"
      mainClassName="mx-auto flex min-h-[40vh] max-w-5xl flex-col items-center justify-center gap-6 p-6 sm:p-8"
    >
      <AdminCommunityAppealReviewPageInner />
    </AdminSearchParamsSuspense>
  );
}
