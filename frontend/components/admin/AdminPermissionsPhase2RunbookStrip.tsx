"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminClipboardCopyButton } from "@/components/admin/AdminClipboardCopyButton";
import { ADMIN_PHASE2_RUNBOOK_QUICK_COMMANDS } from "@/lib/admin/adminPhase2LocalPrepCommands";
import { ADMIN_NOTICE_INFO_CLASS } from "@/lib/adminUi";

/** CI-02 · ① 权限页 Phase ② 本地预备快捷命令（非 staging GO）。 */
export function AdminPermissionsPhase2RunbookStrip() {
  const { t } = useTranslation();

  return (
    <section
      className="mt-4 rounded-[var(--radius-lg)] border border-ink-200 bg-ink-50/60 p-4"
      aria-label={t("admin_phase2_runbook_aria")}
      data-tt-admin-phase2-runbook-strip="1"
    >
      <h2 className="text-body font-semibold text-ink-900">{t("admin_phase2_runbook_title")}</h2>
      <p className={`mt-1 text-small ${ADMIN_NOTICE_INFO_CLASS}`}>{t("admin_phase2_runbook_honesty")}</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ADMIN_PHASE2_RUNBOOK_QUICK_COMMANDS.map((row) => (
          <li
            key={row.id}
            className="rounded-[var(--radius-md)] border border-ink-200 bg-white p-3"
            data-tt-admin-phase2-runbook-item={row.id}
          >
            <p className="text-small font-medium text-ink-900">{t(row.titleKey)}</p>
            <code className="mt-2 block break-all font-mono text-meta text-ink-600">{row.command}</code>
            <AdminClipboardCopyButton
              className="mt-3"
              text={row.command}
              labelKey="admin_phase2_runbook_copy"
              copiedKey="admin_phase2_runbook_copied"
              unavailableKey="admin_phase2_runbook_copy_unavailable"
              dataAttr={row.id}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
