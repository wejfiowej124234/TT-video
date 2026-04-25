"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, useId } from "react";

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
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2WhiteClasses,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

const ABUSE_KEYS = [
  "comment_rate_window_sec",
  "comment_max_per_window",
  "comment_min_interval_sec",
  "comment_duplicate_lookback_sec",
  "post_rate_window_sec",
  "post_max_per_window",
  "post_min_interval_sec",
  "post_duplicate_lookback_sec",
  "report_rate_window_sec",
  "report_max_per_window",
  "report_min_interval_sec",
  "report_duplicate_target_lookback_sec",
] as const;

type AbuseKey = (typeof ABUSE_KEYS)[number];

type Draft = Record<AbuseKey, string>;

function emptyDraft(): Draft {
  const o = {} as Draft;
  for (const k of ABUSE_KEYS) o[k] = "";
  return o;
}

type Res = { status?: string; error?: string; policy?: unknown };

function abuseErr(code: string | undefined, t: (k: string) => string): string {
  switch (code) {
    case "abuse_policy_patch_empty":
      return t("admin_abuse_errEmpty");
    case "abuse_policy_no_effective_change":
      return t("admin_abuse_errNoChange");
    default:
      return adminApiErrorUserText(code, t);
  }
}

/** 160 §5：滥用策略 PATCH（须 super_admin + DB）。 */
export default function AdminCommunityAbusePolicyPage() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const abusePolicyFilterHintId = useId();
  const { meta: buildMeta, loading: buildLoading, error: buildError } =
    useAdminMetaBuildFromPublicMeta("AdminAbusePolicyMetaBuild");
  const [draft, setDraft] = useState<Draft>(() => emptyDraft());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const fieldLabel = useCallback((k: AbuseKey) => t(`admin_abuse_field_${k}`), [t]);

  const setField = (k: AbuseKey, v: string) => {
    setDraft((d) => ({ ...d, [k]: v }));
  };

  const submit = useCallback(() => {
    const patch: Partial<Record<AbuseKey, number>> = {};
    for (const k of ABUSE_KEYS) {
      const raw = draft[k].trim();
      if (raw === "") continue;
      const n = Number.parseInt(raw, 10);
      if (!Number.isFinite(n)) {
        setError(t("admin_abuse_errBadNumber", { field: fieldLabel(k) }));
        return;
      }
      patch[k] = n;
    }
    if (Object.keys(patch).length === 0) {
      setError(t("admin_abuse_errEmpty"));
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
    void adminFetchJson<Res>("AdminCommunityAbusePolicyPatch", apiUrl(routes.admin.communityAbusePolicy), {
      method: "PATCH",
      headers,
      body: JSON.stringify(patch),
    })
      .then(({ res, body: b }) => {
        const err = typeof b?.error === "string" ? b.error : undefined;
        if (res.status === 400 && err) {
          setError(abuseErr(err, t));
          return;
        }
        if (!res.ok) {
          throw new Error(`request_failed_${res.status}`);
        }
        if (b.status !== "ok") {
          adminLogApiJsonStatus("AdminCommunityAbusePolicyPatch", b);
          throw new Error(typeof b.error === "string" ? b.error : "request_failed");
        }
        setDraft(emptyDraft());
        setOk(t("admin_abuse_ok"));
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminCommunityAbusePolicyPatch", e);
        const msg = e instanceof Error ? e.message : "";
        setError(adminApiErrorUserText(msg.trim() || undefined, t));
      })
      .finally(() => setSubmitting(false));
  }, [draft, fieldLabel, t]);

  const grid = useMemo(
    () => (
      <div className="grid gap-3 sm:grid-cols-2">
        {ABUSE_KEYS.map((k) => (
          <label key={k} className="block text-small text-ink-700">
            {fieldLabel(k)}
            <input
              type="text"
              inputMode="numeric"
              name={k}
              value={draft[k]}
              onChange={(e) => setField(k, e.target.value)}
              className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-meta ${travelFocusRingCoreOffset2WhiteClasses}`}
              autoComplete="off"
            />
          </label>
        ))}
      </div>
    ),
    [draft, fieldLabel],
  );

  return (
    <main className="mx-auto max-w-5xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_abuse_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_abuse_subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-small">
          <Link href="/admin/community/policy-change-logs" className={`${touchTargetLink44Classes} text-travel-500 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}>
            {t("admin_abuse_linkLogs")}
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
        className="mt-6 rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4 space-y-4"
        aria-label={t("admin_abuse_form_aria")}
      >
        <p id={abusePolicyFilterHintId} className="text-meta text-ink-600">
          {t("admin_abuse_filter_hint")}
        </p>
        <form
          className="space-y-4"
          aria-describedby={abusePolicyFilterHintId}
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          {grid}
          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting ? true : undefined}
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-600 disabled:opacity-60 ${travelFocusRingCoreOffset2WhiteClasses}`}
          >
            {submitting ? t("admin_abuse_submitting") : t("admin_abuse_submit")}
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
