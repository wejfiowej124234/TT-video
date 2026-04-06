"use client";

import Link from "next/link";
import { useCallback, useState, useId } from "react";

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

const VIS = ["visible", "hidden", "removed"] as const;

const COMMENT_VIS_I18N: Record<(typeof VIS)[number], string> = {
  visible: "admin_comment_vis_opt_visible",
  hidden: "admin_comment_vis_opt_hidden",
  removed: "admin_comment_vis_opt_removed",
};

type Res = { status?: string; error?: string; id?: string; visibility_status?: string };

function visErr(code: string | undefined, t: (k: string) => string): string {
  switch (code) {
    case "invalid_comment_id":
      return t("admin_comment_vis_errBadId");
    case "invalid_comment_visibility_status":
      return t("admin_comment_vis_errBadVis");
    case "community_comment_not_found":
      return t("admin_comment_vis_errNotFound");
    default:
      return adminApiErrorUserText(code, t);
  }
}

/** 160：评论可见性 PATCH（须 admin + DB）。 */
export default function AdminCommunityCommentVisibilityPage() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const commentVisFilterHintId = useId();
  const { meta: buildMeta, loading: buildLoading, error: buildError } =
    useAdminMetaBuildFromPublicMeta("AdminCommentVisibilityMetaBuild");
  const [commentId, setCommentId] = useState("");
  const [visibility, setVisibility] = useState<(typeof VIS)[number]>("hidden");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const submit = useCallback(() => {
    const id = commentId.trim();
    if (!id) {
      setError(t("admin_comment_vis_needId"));
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
    void adminFetchJson<Res>(
      "AdminCommunityCommentVisibility",
      apiUrl(routes.admin.communityCommentVisibility(id)),
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({ visibility_status: visibility }),
      },
    )
      .then(({ res, body: b }) => {
        const err = typeof b?.error === "string" ? b.error : undefined;
        if ((res.status === 400 || res.status === 404) && err) {
          setError(visErr(err, t));
          return;
        }
        if (!res.ok) {
          throw new Error(`request_failed_${res.status}`);
        }
        if (b.status !== "ok") {
          adminLogApiJsonStatus("AdminCommunityCommentVisibility", b);
          throw new Error(typeof b.error === "string" ? b.error : "request_failed");
        }
        const visRaw = b.visibility_status ?? visibility;
        const visNorm =
          visRaw === "visible" || visRaw === "hidden" || visRaw === "removed" ? visRaw : null;
        const visLabel = visNorm ? t(COMMENT_VIS_I18N[visNorm]) : visRaw;
        setOk(t("admin_comment_vis_ok").replace("{{id}}", b.id ?? id).replace("{{vis}}", visLabel));
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminCommunityCommentVisibility", e);
        const msg = e instanceof Error ? e.message : "";
        setError(adminApiErrorUserText(msg.trim() || undefined, t));
      })
      .finally(() => setSubmitting(false));
  }, [commentId, t, visibility]);

  return (
    <main className="mx-auto max-w-5xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_comment_vis_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_comment_vis_subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-small">
          <Link href="/admin/community/reports" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_penalties_linkReports")}
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

      <AdminMetaBuildSection meta={buildMeta} loading={buildLoading} error={buildError} />

      <section
        className="mt-6 rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4 space-y-4 max-w-md"
        aria-label={t("admin_comment_vis_form_aria")}
      >
        <p id={commentVisFilterHintId} className="text-meta text-ink-600">
          {t("admin_comment_vis_filter_hint")}
        </p>
        <form
          className="space-y-4"
          aria-describedby={commentVisFilterHintId}
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <label className="block text-small text-ink-700">
            {t("admin_comment_vis_commentId")}
            <input
              type="text"
              name="comment_id"
              value={commentId}
              onChange={(e) => setCommentId(e.target.value)}
              className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-meta ${travelFocusRingCoreOffset2WhiteClasses}`}
              autoComplete="off"
            />
          </label>
          <label className="block text-small text-ink-700">
            {t("admin_comment_vis_status")}
            <select
              name="visibility_status"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as (typeof VIS)[number])}
              className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono ${travelFocusRingCoreOffset2WhiteClasses}`}
            >
              {VIS.map((v) => (
                <option key={v} value={v}>
                  {t(COMMENT_VIS_I18N[v])}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting ? true : undefined}
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-600 disabled:opacity-60 ${travelFocusRingCoreOffset2WhiteClasses}`}
          >
            {submitting ? t("admin_comment_vis_submitting") : t("admin_comment_vis_submit")}
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
