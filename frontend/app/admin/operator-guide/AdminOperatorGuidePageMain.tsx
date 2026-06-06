"use client";

import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminNoticeBanner } from "@/components/admin/AdminNoticeBanner";
import { ADMIN_STEP_MARKER_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { AdminAdmU01LocalPrepPanel } from "@/components/admin/AdminAdmU01LocalPrepPanel";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import { OPERATOR_GUIDE_FLOW_LINKS, OPERATOR_GUIDE_PHASE2_PREP_COMMANDS, OPERATOR_GUIDE_ROLE_PREP_LINKS } from "./adminOperatorGuidePageModel";
import { OPERATOR_GUIDE_RELATED_FOLD_LINKS } from "@/lib/admin/adminOperatorGuideRelatedFoldLinks";

export function AdminOperatorGuidePageMain() {
  const { t } = useTranslation();
  const titleId = useId();

  return (
    <AdminListPageChrome
      titleId={titleId}
      title={t("admin_operator_guide_title")}
      subtitle={t("admin_operator_guide_lead")}
      mainDataAttrs={{ "data-tt-admin-operator-guide": "1" }}
    >
      <AdminOpsDetailRelatedFold
        relatedLinks={OPERATOR_GUIDE_RELATED_FOLD_LINKS}
        ariaLabelKey="admin_ops_list_related_aria"
        foldSummaryKey="admin_ops_list_related_fold"
        dataTtFold="operator-guide"
      />
      <AdminWarmL5Surface as="section" className="mt-6" data-tt-admin-operator-guide-flow="1">
        <h2 className="text-body-l font-semibold text-ink-900">{t("admin_operator_guide_flow_title")}</h2>
        <ol className="mt-4 space-y-4">
          {OPERATOR_GUIDE_FLOW_LINKS.map((item, i) => (
            <li key={item.href} className="flex gap-3">
              <span className={ADMIN_STEP_MARKER_CLASS} aria-hidden>
                {i + 1}
              </span>
              <div>
                <Link
                  href={item.href}
                  className={adminPageNavLinkClass()}
                >
                  {t(item.key)}
                </Link>
              </div>
            </li>
          ))}
        </ol>
      </AdminWarmL5Surface>

      <AdminWarmL5Surface
        as="section"
        id="admin-operator-guide-role-prep"
        className="mt-6 scroll-mt-24"
        data-tt-admin-operator-guide-role-prep="1"
      >
        <h2 className="text-body font-semibold text-ink-900">{t("admin_operator_guide_role_prep_title")}</h2>
        <p className="mt-1 text-small text-ink-600">{t("admin_operator_guide_role_prep_lead")}</p>
        <ul className="mt-4 space-y-3">
          {OPERATOR_GUIDE_ROLE_PREP_LINKS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={adminPageNavLinkClass()}
              >
                {t(item.key)}
              </Link>
            </li>
          ))}
        </ul>
      </AdminWarmL5Surface>

      <div id="admin-operator-guide-adm-u01-shell-matrix" data-tt-admin-operator-guide-adm-u01="1">
        <AdminAdmU01LocalPrepPanel />
      </div>

      <AdminWarmL5Surface
        as="section"
        id="admin-operator-guide-phase2-prep"
        className="mt-6 scroll-mt-24"
        data-tt-admin-operator-guide-phase2-prep="1"
      >
        <h2 className="text-body font-semibold text-ink-900">{t("admin_operator_guide_phase2_prep_title")}</h2>
        <p className="mt-1 text-small text-ink-600">{t("admin_operator_guide_phase2_prep_lead")}</p>
        <ol className="mt-4 list-inside list-decimal space-y-2 font-mono text-small text-ink-800 text-ink-700">
          {OPERATOR_GUIDE_PHASE2_PREP_COMMANDS.map((cmd, index) => (
            <li key={`${index}-${cmd}`}>{cmd}</li>
          ))}
        </ol>
        <p className="mt-3 text-meta">{t("admin_operator_guide_phase2_prep_honesty")}</p>
      </AdminWarmL5Surface>

      <AdminWarmL5Surface as="section" className="mt-6" data-tt-admin-operator-guide-readme="1">
        <h2 className="text-body font-semibold text-ink-900">{t("admin_operator_guide_readme_title")}</h2>
        <p className="mt-2 text-small text-ink-600">{t("admin_operator_guide_readme_hint")}</p>
        <p className="mt-3 font-mono text-small text-ink-800 text-ink-500">frontend/app/admin/README.md</p>
      </AdminWarmL5Surface>

      <AdminNoticeBanner tone="info" className="mt-6" message={t("admin_operator_guide_phase_note")} />
    </AdminListPageChrome>
  );
}
