"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminClipboardCopyButton } from "@/components/admin/AdminClipboardCopyButton";
import { AdminNoticeBanner } from "@/components/admin/AdminNoticeBanner";
import { ADMIN_PHASE2_RUNBOOK_QUICK_COMMANDS } from "@/lib/admin/adminPhase2LocalPrepCommands";
import { adminPageNavLinkClass } from "@/lib/adminUi";

type Variant = "maintainer" | "inline";

function Phase2PrepLinks() {
  const { t } = useTranslation();
  return (
    <>
      {t("admin_home_phase2_prep_notice_short")}{" "}
      <Link href="/admin/operator-guide#admin-operator-guide-role-prep" className={adminPageNavLinkClass()}>
        {t("admin_home_phase2_prep_guide")}
      </Link>
      {" · "}
      <Link
        href="/admin/permissions#admin-phase2-remaining-backlog"
        className={adminPageNavLinkClass()}
        data-tt-admin-home-phase2-backlog-link="1"
      >
        {t("admin_home_phase2_backlog_link")}
      </Link>
    </>
  );
}

/** ① Phase ② 诚实边界；工程路径仅维护者折叠内展示。 */
export function AdminHomePhase2PrepNotice(props: { variant?: Variant }) {
  const { t } = useTranslation();
  const variant = props.variant ?? "maintainer";

  const l5GreenCmd = ADMIN_PHASE2_RUNBOOK_QUICK_COMMANDS[0]?.command ?? "";

  if (variant === "inline") {
    return (
      <AdminNoticeBanner
        tone="readonly"
        size="sm"
        dataAttrs={{ "data-tt-admin-home-phase2-prep": "1" }}
        message={
          <div className="space-y-2">
            <p className="text-small text-ink-700">
              <Phase2PrepLinks />
            </p>
            {l5GreenCmd ? (
              <div data-tt-admin-home-phase2-quick-prep="1">
                <code className="block break-all font-mono text-meta text-ink-600">{l5GreenCmd}</code>
                <AdminClipboardCopyButton
                  className="mt-2"
                  text={l5GreenCmd}
                  labelKey="admin_home_phase2_copy_l5_green"
                  copiedKey="admin_phase2_runbook_copied"
                  unavailableKey="admin_phase2_runbook_copy_unavailable"
                  dataAttr="l5-green"
                />
              </div>
            ) : null}
          </div>
        }
      />
    );
  }

  return (
    <div data-tt-admin-home-phase2-prep="1" className="space-y-2">
      <AdminNoticeBanner
        tone="readonly"
        size="md"
        message={
          <p className="text-small text-ink-700">
            <Phase2PrepLinks />
          </p>
        }
      />
      <p className="text-meta text-ink-500" data-tt-admin-home-phase2-prep-tech="1">
        {t("admin_home_phase2_prep_tech_detail")}
      </p>
    </div>
  );
}
