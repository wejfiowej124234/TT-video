"use client";

import Link from "next/link";
import { ME_SETTINGS_HUB_PATH, TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";

/** 设置族子页返回 Hub（改密 / 安全 / 隐私说明） */
export function MeSettingsHubBackLink({ t }: { t: (key: string) => string }) {
  return (
    <Link href={ME_SETTINGS_HUB_PATH} className={TT_ME_SETTINGS_L5.backLink}>
      ← {t("me_settings_back_hub")}
    </Link>
  );
}
