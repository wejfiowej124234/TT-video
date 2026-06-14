"use client";

import Link from "next/link";
import { FOCUS_RING } from "@/components/me/constants";
import { ME_IDENTITIES_HUB_PATH } from "@/lib/me/meIdentitiesL5";
import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";

/** 槽位未 active 时：引导申请（可选）+ 多重身份 Hub。 */
export function WorkspaceOperatorLockedPanel({
  t,
  messageKey,
  ariaLabelKey,
  applyHref,
  applyLabelKey = "workspace_cta_continue_apply",
}: {
  t: (key: string) => string;
  messageKey: string;
  ariaLabelKey: string;
  /** 槽位 pending/restricted 时直达 register/onboarding */
  applyHref?: string;
  applyLabelKey?: string;
}) {
  return (
    <div
      className={TT_WORKSPACE_L5.warningPanel}
      role="region"
      aria-label={t(ariaLabelKey)}
      data-tt-workspace-operator-locked="1"
    >
      <p className="text-small text-warning/95 mb-4">{t(messageKey)}</p>
      <div className="flex flex-wrap gap-2">
        {applyHref ? (
          <Link href={applyHref} className={`${TT_WORKSPACE_L5.primaryBtn} ${FOCUS_RING}`}>
            {t(applyLabelKey)}
          </Link>
        ) : null}
        <Link
          href={ME_IDENTITIES_HUB_PATH}
          className={`${applyHref ? TT_WORKSPACE_L5.navLink : TT_WORKSPACE_L5.primaryBtn} ${FOCUS_RING}`}
        >
          {t("workspace_cta_identities_hub")}
        </Link>
      </div>
    </div>
  );
}
