"use client";

import Link from "next/link";
import { FOCUS_RING } from "@/components/me/constants";
import { STEWARD_WORKSPACE_HREF } from "@/lib/workspace/workspaceIdentityModel";
import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";

export function StewardWorkbenchSubpageBackLink({ t }: { t: (key: string) => string }) {
  return (
    <div className="mb-4" data-tt-steward-subpage-back-workbench="1">
      <Link href={STEWARD_WORKSPACE_HREF} className={`${TT_WORKSPACE_L5.navLink} ${FOCUS_RING}`}>
        {t("steward_workbench_subpage_back")}
      </Link>
    </div>
  );
}
