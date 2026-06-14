"use client";



import Link from "next/link";

import { ME_SETTINGS_HUB_PATH } from "@/lib/me/meSettingsL5";

import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";



/** 经营工作台顶栏返回：统一回设置中心（含 `/guide` · `/provider` 等） */

export function WorkspaceL5BackLink({ t }: { t: (key: string) => string }) {

  return (

    <Link href={ME_SETTINGS_HUB_PATH} className={TT_WORKSPACE_L5.backLink}>

      ← {t("me_settings_back_hub")}

    </Link>

  );

}

