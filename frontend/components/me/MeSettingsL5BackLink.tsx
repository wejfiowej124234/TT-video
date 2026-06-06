"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { COMMUNITY_FEED_PATH } from "@/lib/auth/postAuthReturnPath";
import { ME_SETTINGS_HUB_PATH, ME_SETTINGS_PROFILE_PATH, TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";

/** 设置 Hub 顶栏返回：默认社区资料；`?from=identities` 回多重身份 */
export function MeSettingsL5BackLink({ t }: { t: (key: string) => string }) {
  const searchParams = useSearchParams();
  const from = searchParams?.get("from");
  const { href, labelKey } = useMemo(() => {
    if (from === "identities") {
      return { href: "/me/identities", labelKey: "me_settings_back_identities" as const };
    }
    if (from === "settings") {
      return { href: ME_SETTINGS_HUB_PATH, labelKey: "me_settings_back_hub" as const };
    }
    if (from === "community") {
      return { href: ME_SETTINGS_PROFILE_PATH, labelKey: "me_settings_back_community" as const };
    }
    return { href: COMMUNITY_FEED_PATH, labelKey: "me_settings_back_community" as const };
  }, [from]);

  return (
    <Link href={href} className={TT_ME_SETTINGS_L5.backLink}>
      ← {t(labelKey)}
    </Link>
  );
}
