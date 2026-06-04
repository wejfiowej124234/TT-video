"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminClipboardCopyButton } from "@/components/admin/AdminClipboardCopyButton";
import { AdminNoticeBanner } from "@/components/admin/AdminNoticeBanner";
import {
  ADMIN_ADM_U01_SHELL_PREP_FLOWS,
  ADMIN_PHASE2_STAGING_ONLY_COMMANDS,
} from "@/lib/admin/adminPhase2LocalPrepCommands";
import { ADMIN_NOTICE_INFO_CLASS } from "@/lib/adminUi";

/** IA-06 / RBAC-05 · ① ADM-U01 Shell 矩阵本地 Playwright 预备（非 ② staging GO）。 */
export function AdminAdmU01LocalPrepPanel() {
  const { t } = useTranslation();

  return (
    <section
      id="admin-adm-u01-local-prep"
      className="mt-6 scroll-mt-24 rounded-[var(--radius-lg)] border border-ink-200 bg-white p-4"
      aria-label={t("admin_adm_u01_prep_aria")}
      data-tt-admin-adm-u01-local-prep-panel="1"
    >
      <h2 className="text-body font-semibold text-ink-900">{t("admin_adm_u01_prep_title")}</h2>
      <p className={`mt-1 text-small ${ADMIN_NOTICE_INFO_CLASS}`}>{t("admin_adm_u01_prep_honesty")}</p>

      <ul className="mt-4 space-y-4">
        {ADMIN_ADM_U01_SHELL_PREP_FLOWS.map((flow) => (
          <li
            key={flow.id}
            className="rounded-[var(--radius-md)] border border-ink-200 bg-ink-50/50 p-3"
            data-tt-admin-adm-u01-prep-flow={flow.id}
          >
            <h3 className="text-small font-semibold text-ink-900">{t(flow.titleKey)}</h3>
            <p className="mt-1 text-meta text-ink-600">{t(flow.descKey)}</p>
            <p className="mt-2 text-meta text-ink-500">
              {t("admin_adm_u01_prep_evidence")}:{" "}
              <code className="font-mono text-ink-700">{flow.evidencePath}</code>
            </p>
            <code className="mt-2 block break-all font-mono text-meta text-ink-800">{flow.command}</code>
            <AdminClipboardCopyButton
              className="mt-2"
              text={flow.command}
              labelKey="admin_phase2_runbook_copy"
              copiedKey="admin_phase2_runbook_copied"
              unavailableKey="admin_phase2_runbook_copy_unavailable"
              dataAttr={`adm-u01-${flow.id}`}
            />
          </li>
        ))}
      </ul>

      <AdminNoticeBanner
        tone="warning"
        size="md"
        className="mt-4"
        dataAttrs={{ "data-tt-admin-adm-u01-staging-only": "1" }}
        message={
          <div>
            <p className="font-medium">{t("admin_adm_u01_prep_staging_only_title")}</p>
            <ul className="mt-2 list-inside list-disc font-mono text-meta">
              {ADMIN_PHASE2_STAGING_ONLY_COMMANDS.map((cmd) => (
                <li key={cmd}>{cmd}</li>
              ))}
            </ul>
          </div>
        }
      />
    </section>
  );
}
