"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminClipboardCopyButton } from "@/components/admin/AdminClipboardCopyButton";
import { AdminNoticeBanner } from "@/components/admin/AdminNoticeBanner";
import {
  ADMIN_PHASE2_STAGING_ONLY_COMMANDS,
  OPERATOR_GUIDE_PHASE2_PREP_COMMANDS,
} from "@/lib/admin/adminPhase2LocalPrepCommands";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import { ADMIN_NOTICE_INFO_CLASS, ADMIN_PHASE2_RECORD_CODE_BLOCK_CLASS, ADMIN_PHASE2_RECORD_DETAILS_CLASS, ADMIN_PHASE2_STAGING_NOTICE_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";

/** CI-02 · ② Staging 收口编排诚实面板（① 仅预备 · 非 TT_PHASE2_ADMIN_STAGING: PASS）。 */
export function AdminPhase2StagingRecordPanel() {
  const { t } = useTranslation();
  const recordCmd = ADMIN_PHASE2_STAGING_ONLY_COMMANDS[0] ?? "";

  return (
    <AdminWarmL5Surface
      as="section"
      id="admin-phase2-staging-record"
      className={`mt-6 scroll-mt-24 ${ADMIN_PHASE2_STAGING_NOTICE_CLASS}`}
      aria-label={t("admin_phase2_staging_record_aria")}
      data-tt-admin-phase2-staging-record-panel="1"
    >
      <h2 className="text-body font-semibold text-ink-900">{t("admin_phase2_staging_record_title")}</h2>
      <p className={`mt-1 text-small ${ADMIN_NOTICE_INFO_CLASS}`}>{t("admin_phase2_staging_record_lead")}</p>

      <ol className="mt-4 list-inside list-decimal space-y-2 text-small text-ink-800">
        <li data-tt-admin-phase2-staging-record-step="l5">{t("admin_phase2_staging_record_step_l5")}</li>
        <li data-tt-admin-phase2-staging-record-step="remaining">
          {t("admin_phase2_staging_record_step_remaining")}
        </li>
        <li data-tt-admin-phase2-staging-record-step="adm-u01">{t("admin_phase2_staging_record_step_u01")}</li>
        <li data-tt-admin-phase2-staging-record-step="adm-u02">{t("admin_phase2_staging_record_step_u02")}</li>
        <li data-tt-admin-phase2-staging-record-step="record">{t("admin_phase2_staging_record_step_record")}</li>
      </ol>

      <AdminNoticeBanner
        tone="warning"
        size="md"
        className="mt-4"
        message={t("admin_phase2_staging_record_honesty")}
        dataAttrs={{ "data-tt-admin-phase2-staging-record-honesty": "1" }}
      />

      <p className="mt-4 text-meta font-medium text-ink-700">{t("admin_phase2_staging_record_cmd_label")}</p>
      <code
        className={ADMIN_PHASE2_RECORD_CODE_BLOCK_CLASS}
        data-tt-admin-phase2-staging-record-cmd="1"
      >
        {recordCmd}
      </code>
      <AdminClipboardCopyButton
        className="mt-2"
        text={recordCmd}
        labelKey="admin_phase2_backlog_copy_cmd"
        copiedKey="admin_phase2_runbook_copied"
        unavailableKey="admin_phase2_runbook_copy_unavailable"
        dataAttr="ci02-record"
      />

      <details className={ADMIN_PHASE2_RECORD_DETAILS_CLASS}>
        <summary className="cursor-pointer text-small font-medium text-ink-800">
          {t("admin_phase2_staging_record_prep_chain_title")}
        </summary>
        <ol className="mt-2 list-inside list-decimal space-y-1 font-mono text-meta text-ink-700">
          {OPERATOR_GUIDE_PHASE2_PREP_COMMANDS.map((cmd, index) => (
            <li
              key={`${index}-${cmd}`}
              data-tt-admin-phase2-staging-record-prep-cmd={cmd.slice(0, 24)}
            >
              {cmd}
            </li>
          ))}
        </ol>
      </details>

      <p className="mt-4 text-small">
        <Link href="/admin/operator-guide#admin-operator-guide-phase2-prep" className={adminPageNavLinkClass()}>
          {t("admin_phase2_staging_record_operator_guide")}
        </Link>
        {" · "}
        <Link href="#admin-phase2-remaining-backlog" className={adminPageNavLinkClass()}>
          {t("admin_phase2_backlog_anchor")}
        </Link>
      </p>
    </AdminWarmL5Surface>
  );
}
