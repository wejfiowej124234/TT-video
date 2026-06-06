"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ME_SETTINGS_HUB_PATH } from "@/lib/me/meSettingsL5";

/** 从子页导航回 Hub 时刷新安全状态（补足 visibility 钩子） */
export function useMeSettingsHubPathnameReload(reload: () => void, enabled = true) {
  const pathname = usePathname();
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (!enabled) return;
    const wasHub = prevPath.current === ME_SETTINGS_HUB_PATH;
    const isHub = pathname === ME_SETTINGS_HUB_PATH;
    if (!wasHub && isHub) reload();
    prevPath.current = pathname;
  }, [pathname, reload, enabled]);
}
