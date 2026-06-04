"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminNoticeBanner } from "@/components/admin/AdminNoticeBanner";
import { AdminClipboardCopyButton } from "@/components/admin/AdminClipboardCopyButton";
import { ADMIN_PHASE2_REMAINING_BACKLOG_ITEMS } from "@/lib/admin/adminPhase2RemainingBacklog";
import { adminPhase2LocalPrepCommand } from "@/lib/admin/adminPhase2LocalPrepCommands";
import type { AdminPhase2PrepFlags } from "@/lib/admin/adminRole70Matrix";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import { adminPageNavLinkClass } from "@/lib/adminUi";

function prepDetailForItem(
  id: (typeof ADMIN_PHASE2_REMAINING_BACKLOG_ITEMS)[number]["id"],
  prep: AdminPhase2PrepFlags | null,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  if (id === "ADM-UX-RBAC-06") {
    const totp = prep?.totp_verification_wired ? t("admin_phase2_backlog_flag_on") : t("admin_phase2_backlog_flag_off");
    const enforce = prep?.enforce_2fa ? t("admin_phase2_backlog_flag_on") : t("admin_phase2_backlog_flag_off");
    const prod = prep?.production_admin_go ? t("admin_phase2_backlog_flag_on") : t("admin_phase2_backlog_flag_off");
    return t("admin_phase2_backlog_rbac06_live", { totp, enforce, prod });
  }
  if (id === "ADM-UX-RBAC-05") {
    const staging = prep?.staging_admin_matrix_go
      ? t("admin_phase2_backlog_flag_on")
      : t("admin_phase2_backlog_flag_off");
    return t("admin_phase2_backlog_rbac05_live", { staging });
  }
  const item = ADMIN_PHASE2_REMAINING_BACKLOG_ITEMS.find((x) => x.id === id);
  return item ? t(item.prepKey) : "—";
}

/** CI-02 · 六项剩余 backlog 诚实表（① 预备 · ②/③ 仍 OPEN）。 */
export function AdminPhase2RemainingBacklogPanel() {
  const { t } = useTranslation();
  const caps = useAdminCapabilities();
  const prep = caps.phase2Prep;

  return (
    <section
      id="admin-phase2-remaining-backlog"
      className="mt-6 scroll-mt-24 rounded-[var(--radius-lg)] border border-ink-200 bg-white p-4"
      aria-label={t("admin_phase2_backlog_aria")}
      data-tt-admin-phase2-remaining-backlog="1"
    >
      <h2 className="text-body font-semibold text-ink-900">{t("admin_phase2_backlog_title")}</h2>
      <p className="mt-1 text-small text-ink-600">{t("admin_phase2_backlog_lead")}</p>

      <AdminNoticeBanner
        tone="warning"
        size="md"
        className="mt-3"
        message={t("admin_phase2_backlog_honesty")}
        dataAttrs={{ "data-tt-admin-phase2-backlog-honesty": "1" }}
      />

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-small" aria-label={t("admin_phase2_backlog_aria")}>
          <thead className="bg-ink-50 text-meta font-medium text-ink-600">
            <tr>
              <th scope="col" className="px-3 py-2">
                {t("admin_phase2_backlog_col_id")}
              </th>
              <th scope="col" className="px-3 py-2">
                {t("admin_phase2_backlog_col_item")}
              </th>
              <th scope="col" className="px-3 py-2">
                {t("admin_phase2_backlog_col_phase")}
              </th>
              <th scope="col" className="px-3 py-2">
                {t("admin_phase2_backlog_col_prep")}
              </th>
              <th scope="col" className="px-3 py-2">
                {t("admin_phase2_backlog_col_status")}
              </th>
              <th scope="col" className="px-3 py-2">
                {t("admin_phase2_backlog_col_action")}
              </th>
              <th scope="col" className="px-3 py-2">
                {t("admin_phase2_backlog_col_local_cmd")}
              </th>
            </tr>
          </thead>
          <tbody>
            {ADMIN_PHASE2_REMAINING_BACKLOG_ITEMS.map((row) => (
              <tr
                key={row.id}
                className="border-t border-ink-100"
                data-tt-admin-phase2-remaining-row={row.id}
                data-tt-admin-phase2-remaining-open="1"
              >
                <td className="px-3 py-2 font-mono text-meta">{row.id}</td>
                <td className="px-3 py-2 text-ink-900">{t(row.titleKey)}</td>
                <td className="px-3 py-2 text-ink-700">{t(row.phaseKey)}</td>
                <td className="max-w-md px-3 py-2 text-meta text-ink-600">
                  {prepDetailForItem(row.id, prep, t)}
                </td>
                <td className="px-3 py-2 font-medium text-ink-800" data-tt-admin-phase2-remaining-status="open">
                  {t("admin_phase2_backlog_status_open")}
                </td>
                <td className="px-3 py-2">
                  <Link
                    href={row.prepHref}
                    className={adminPageNavLinkClass()}
                    data-tt-admin-phase2-remaining-prep-link={row.id}
                  >
                    {t("admin_phase2_backlog_open_prep")}
                  </Link>
                </td>
                <td className="max-w-xs px-3 py-2" data-tt-admin-phase2-remaining-local-cmd={row.id}>
                  <code className="block break-all font-mono text-meta text-ink-600">
                    {adminPhase2LocalPrepCommand(row.id)}
                  </code>
                  <AdminClipboardCopyButton
                    className="mt-2"
                    text={adminPhase2LocalPrepCommand(row.id)}
                    labelKey="admin_phase2_backlog_copy_cmd"
                    copiedKey="admin_phase2_runbook_copied"
                    unavailableKey="admin_phase2_runbook_copy_unavailable"
                    dataAttr={row.id}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-meta">{t("admin_phase2_closure_prep_skeleton_cmd")}</p>
      <p className="mt-2">
        <Link href="/admin/operator-guide#admin-operator-guide-phase2-prep" className={adminPageNavLinkClass()}>
          {t("admin_phase2_backlog_operator_guide")}
        </Link>
      </p>
    </section>
  );
}
