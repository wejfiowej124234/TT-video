"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminNoticeBanner } from "@/components/admin/AdminNoticeBanner";
import { adminPageNavLinkClass } from "@/lib/adminUi";

/** CI-02 · ① Phase ② Admin 收口预备清单（release_gate NOT_MET · 非 GO）。 */
export function AdminPhase2ClosurePrepPanel() {
  const { t } = useTranslation();

  return (
    <AdminNoticeBanner
      tone="info"
      size="lg"
      className="mt-6"
      dataAttrs={{ "data-tt-admin-phase2-closure-prep-panel": "1" }}
      message={
        <div className="space-y-2">
          <p className="font-medium">{t("admin_phase2_closure_prep_title")}</p>
          <p className="text-small">{t("admin_phase2_closure_prep_lead")}</p>
          <ol className="list-inside list-decimal space-y-1 text-small">
            <li>{t("admin_phase2_closure_prep_step_l5")}</li>
            <li>{t("admin_phase2_closure_prep_step_remaining")}</li>
            <li>{t("admin_phase2_closure_prep_step_u01")}</li>
            <li>{t("admin_phase2_closure_prep_step_record")}</li>
          </ol>
          <p className="text-meta">{t("admin_phase2_closure_prep_not_met")}</p>
          <p className="text-meta font-mono text-small">{t("admin_phase2_closure_prep_skeleton_cmd")}</p>
          <p>
            <Link
              href="/admin/operator-guide#admin-operator-guide-role-prep"
              className={adminPageNavLinkClass()}
            >
              {t("admin_phase2_closure_prep_guide")}
            </Link>
            {" · "}
            <Link
              href="#admin-phase2-staging-record"
              className={adminPageNavLinkClass()}
            >
              {t("admin_phase2_staging_record_anchor")}
            </Link>
            {" · "}
            <Link
              href="#admin-phase2-remaining-backlog"
              className={adminPageNavLinkClass()}
            >
              {t("admin_phase2_backlog_anchor")}
            </Link>
          </p>
        </div>
      }
    />
  );
}
