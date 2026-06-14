"use client";

import Link from "next/link";
import { useMemo, useId } from "react";

import { AdminCommunityListHeaderAside } from "@/components/admin/AdminCommunityListHeaderAside";
import { AdminCommunityRelatedLinks } from "@/components/admin/AdminCommunityRelatedLinks";
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
import {
  ADMIN_FILTER_CARD_CLASS,
  ADMIN_FILTER_FIELD_LABEL_CLASS,
  ADMIN_FILTER_INPUT_SM_CLASS,
  ADMIN_FORM_FIELD_FOCUS_CLASS,
  ADMIN_LINK_FOCUS_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  adminPageNavLinkClass,
} from "@/lib/adminUi";

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
          <label key={k} className={`block ${ADMIN_FILTER_FIELD_LABEL_CLASS}`}>
            {fieldLabel(k)}
            <input
              type="text"
              inputMode="numeric"
              name={k}
              value={draft[k]}
              onChange={(e) => setField(k, e.target.value)}
              className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1 font-mono text-small text-ink-800 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
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
      subtitle={t("admin_abuse_subtitle_l5")}
      headerAside={
        <AdminCommunityListHeaderAside>
      <AdminCommunityRelatedLinks />

          <Link href="/admin/community/policy-change-logs" className={`${adminPageNavLinkClass()}`}>
            {t("admin_abuse_linkLogs")}
          </Link></AdminCommunityListHeaderAside>
      }
    >
      <AdminMetaBuildSection meta={buildMeta} loading={buildLoading} error={buildError} />

      <section
        className={`mt-6 ${ADMIN_FILTER_CARD_CLASS} space-y-4`}
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
