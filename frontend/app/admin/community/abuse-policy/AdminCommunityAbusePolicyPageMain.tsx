"use client";

import Link from "next/link";
import { useMemo, useId } from "react";

import { AdminSuccessBanner } from "@/components/admin/AdminSuccessBanner";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminAlertError } from "@/components/admin/AdminAlertError";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { useTranslation } from "@/components/LocaleProvider";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { useAdminCanWrite } from "@/lib/admin/useAdminCanWrite";
import { ABUSE_POLICY_KEYS } from "./adminCommunityAbusePolicyPageModel";
import { useAdminCommunityAbusePolicyPage } from "./useAdminCommunityAbusePolicyPage";
import { ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_LINK_FOCUS_CLASS, ADMIN_PRIMARY_ACTION_BTN_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";

export function AdminCommunityAbusePolicyPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const abusePolicyFilterHintId = useId();
  const {
    buildMeta,
    buildLoading,
    buildError,
    draft,
    setField,
    fieldLabel,
    submitting,
    error,
    errorKind,
    ok,
    submit,
  } = useAdminCommunityAbusePolicyPage();
  const { canWrite } = useAdminCanWrite(ADMIN_PERM.COMMUNITY_SUPER);

  const grid = useMemo(
    () => (
      <div className="grid gap-3 sm:grid-cols-2">
        {ABUSE_POLICY_KEYS.map((k) => (
          <label key={k} className="block text-small text-ink-700">
            {fieldLabel(k)}
            <input
              type="text"
              inputMode="numeric"
              name={k}
              value={draft[k]}
              onChange={(e) => setField(k, e.target.value)}
              className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-meta ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              autoComplete="off"
            />
          </label>
        ))}
      </div>
    ),
    [draft, fieldLabel, setField],
  );

  return (
    <AdminDetailPageChrome
      titleId={pageTitleId}
      title={t("admin_abuse_title")}
      subtitle={t("admin_abuse_subtitle")}
      headerAside={
        <>
          <Link href="/admin/community/policy-change-logs" className={`${adminPageNavLinkClass()}`}>
            {t("admin_abuse_linkLogs")}
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
          {canWrite ? (
          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting ? true : undefined}
            className={ADMIN_PRIMARY_ACTION_BTN_CLASS}
          >
            {submitting ? t("admin_abuse_submitting") : t("admin_abuse_submit")}
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
