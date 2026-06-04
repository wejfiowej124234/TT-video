"use client";

import Link from "next/link";
import { useId } from "react";

import { AdminSuccessBanner } from "@/components/admin/AdminSuccessBanner";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminAlertError } from "@/components/admin/AdminAlertError";
import { useTranslation } from "@/components/LocaleProvider";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { useAdminCanWrite } from "@/lib/admin/useAdminCanWrite";
import {
  COMMENT_VIS_I18N,
  COMMENT_VISIBILITY_STATUSES,
} from "./adminCommunityCommentVisibilityPageModel";
import { useAdminCommunityCommentVisibilityPage } from "./useAdminCommunityCommentVisibilityPage";
import { ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_LINK_FOCUS_CLASS, ADMIN_PRIMARY_ACTION_BTN_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";

/** 160：评论可见性 PATCH（须 admin + DB）。 */
export function AdminCommunityCommentVisibilityPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const commentVisFilterHintId = useId();
  const {
    buildMeta,
    buildLoading,
    buildError,
    commentId,
    setCommentId,
    visibility,
    setVisibility,
    submitting,
    error,
    errorKind,
    ok,
    submit,
  } = useAdminCommunityCommentVisibilityPage();
  const { canWrite } = useAdminCanWrite(ADMIN_PERM.COMMUNITY_MODERATE);

  return (
    <AdminDetailPageChrome
      titleId={pageTitleId}
      title={t("admin_comment_vis_title")}
      subtitle={t("admin_comment_vis_subtitle")}
      headerAside={
        <>
          <Link href="/admin/community/reports" className={`${adminPageNavLinkClass()}`}>
            {t("admin_penalties_linkReports")}
          </Link>
          <Link
            href="/admin/observability"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${adminPageNavLinkClass()}`}>
            {t("admin_community_reports_back")}
          </Link>
        </>
      }
    >
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
              className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-meta ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              autoComplete="off"
            />
          </label>
          <label className="block text-small text-ink-700">
            {t("admin_comment_vis_status")}
            <select
              name="visibility_status"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as (typeof COMMENT_VISIBILITY_STATUSES)[number])}
              className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            >
              {COMMENT_VISIBILITY_STATUSES.map((v) => (
                <option key={v} value={v}>
                  {t(COMMENT_VIS_I18N[v])}
                </option>
              ))}
            </select>
          </label>
          {canWrite ? (
          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting ? true : undefined}
            className={ADMIN_PRIMARY_ACTION_BTN_CLASS}
          >
            {submitting ? t("admin_comment_vis_submitting") : t("admin_comment_vis_submit")}
          </button>
          ) : null}
        </form>
      </section>

      {error && errorKind ? (
        <AdminAlertError className="mt-4" message={error} errorKind={errorKind} />
      ) : null}
      {ok ? <AdminSuccessBanner className="mt-4" message={ok} /> : null}
    </AdminDetailPageChrome>
  );
}
