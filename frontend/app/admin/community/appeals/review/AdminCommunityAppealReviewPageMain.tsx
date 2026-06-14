"use client";

import Link from "next/link";
import { useId } from "react";

import { AdminCommunityListHeaderAside } from "@/components/admin/AdminCommunityListHeaderAside";
import { AdminSuccessBanner } from "@/components/admin/AdminSuccessBanner";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminAlertError } from "@/components/admin/AdminAlertError";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { useTranslation } from "@/components/LocaleProvider";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { useAdminCanWrite } from "@/lib/admin/useAdminCanWrite";
import { APPEAL_DECISION_I18N, APPEAL_REVIEW_DECISIONS } from "./adminCommunityAppealReviewPageModel";
import { useAdminCommunityAppealReviewPage } from "./useAdminCommunityAppealReviewPage";
import { ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_LINK_FOCUS_CLASS, ADMIN_PRIMARY_ACTION_BTN_CLASS, adminPageNavLinkClass, ADMIN_FILTER_CARD_CLASS,
  ADMIN_FILTER_INPUT_SM_CLASS,
  ADMIN_FILTER_FIELD_LABEL_CLASS} from "@/lib/adminUi";

export function AdminCommunityAppealReviewPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const appealReviewFilterHintId = useId();
  const {
    buildMeta,
    buildLoading,
    buildError,
    appealId,
    setAppealId,
    expectedVersion,
    setExpectedVersion,
    decision,
    setDecision,
    reviewerNote,
    setReviewerNote,
    submitting,
    error,
    errorKind,
    ok,
    submit,
  } = useAdminCommunityAppealReviewPage();
  const { canWrite } = useAdminCanWrite(ADMIN_PERM.COMMUNITY_SUPER);

  return (
    <AdminDetailPageChrome
      titleId={pageTitleId}
      title={t("admin_appeal_review_title")}
      subtitle={t("admin_appeal_review_subtitle_l5")}
      headerAside={
        <AdminCommunityListHeaderAside>
      <AdminCommunityRelatedLinks />

          <Link href="/admin/community/appeals" className={`${adminPageNavLinkClass()}`}>
            {t("admin_appeals_linkLedger")}
          </Link>
          <Link href="/admin/community/reports" className={`${adminPageNavLinkClass()}`}>
            {t("admin_penalties_linkReports")}
          </Link></AdminCommunityListHeaderAside>
      }
    >
      <AdminMetaBuildSection meta={buildMeta} loading={buildLoading} error={buildError} />

      <section
        className={`mt-6 ${ADMIN_FILTER_CARD_CLASS} space-y-4 max-w-md`}
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
          <label className={`block ${ADMIN_FILTER_FIELD_LABEL_CLASS}`}>
            {t("admin_appeal_review_appealId")}
            <input
              type="text"
              name="appeal_id"
              value={appealId}
              onChange={(e) => setAppealId(e.target.value)}
              className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1 font-mono text-small text-ink-800 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              autoComplete="off"
            />
          </label>
          <label className={`block ${ADMIN_FILTER_FIELD_LABEL_CLASS}`}>
            {t("admin_appeal_review_expectedVer")}
            <input
              type="text"
              inputMode="numeric"
              name="expected_version"
              value={expectedVersion}
              onChange={(e) => setExpectedVersion(e.target.value)}
              className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1 font-mono text-small text-ink-800 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            />
          </label>
          <label className={`block ${ADMIN_FILTER_FIELD_LABEL_CLASS}`}>
            {t("admin_appeal_review_decision")}
            <select
              name="decision"
              value={decision}
              onChange={(e) => setDecision(e.target.value as (typeof APPEAL_REVIEW_DECISIONS)[number])}
              className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1 font-mono ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            >
              {APPEAL_REVIEW_DECISIONS.map((d) => (
                <option key={d} value={d}>
                  {t(APPEAL_DECISION_I18N[d])}
                </option>
              ))}
            </select>
          </label>
          <label className={`block ${ADMIN_FILTER_FIELD_LABEL_CLASS}`}>
            {t("admin_appeal_review_note")}
            <textarea
              name="reviewer_note"
              value={reviewerNote}
              onChange={(e) => setReviewerNote(e.target.value)}
              rows={3}
              className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            />
          </label>
          {canWrite ? (
          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting ? true : undefined}
            className={ADMIN_PRIMARY_ACTION_BTN_CLASS}
          >
            {submitting ? t("admin_appeal_review_submitting") : t("admin_appeal_review_submit")}
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
