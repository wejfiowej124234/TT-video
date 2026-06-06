"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { adminPageNavLinkClass } from "@/lib/adminUi";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

/** FIN-02 · ① 财务七件套子页顶栏回链：枢纽 → 工作台（收件箱见面包屑 · batch57）。 */
export function AdminFinanceSuiteBackLinks(props: { showWorkspace?: boolean }) {
  const { t } = useTranslation();
  const { showWorkspace = false } = props;
  const link = adminPageNavLinkClass();

  return (
    <>
      <Link
        href="/admin/finance-suite"
        className={`${touchTargetLink44Classes} ${link} ${travelFocusRingOffset2Classes}`}
        data-tt-admin-fin-back-suite="1"
      >
        {t("admin_fin_suite_title")}
      </Link>
      {showWorkspace ? (
        <Link
          href="/admin"
          className={`${touchTargetLink44Classes} ${link} ${travelFocusRingOffset2Classes}`}
          data-tt-admin-fin-back-workspace="1"
        >
          {t("admin_shell_nav_workspace")}
        </Link>
      ) : null}
    </>
  );
}
