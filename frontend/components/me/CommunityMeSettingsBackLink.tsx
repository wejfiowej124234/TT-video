"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ME_SETTINGS_HUB_PATH, TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";

/** 从设置 Hub 进入社区资料时显示返回设置 */
export function CommunityMeSettingsBackLink({ t }: { t: (key: string) => string }) {
  const from = useSearchParams()?.get("from");
  if (from !== "settings") return null;

  return (
    <Link href={ME_SETTINGS_HUB_PATH} className={`${TT_ME_SETTINGS_L5.backLink} mb-2`}>
      ← {t("me_settings_back_hub")}
    </Link>
  );
}
