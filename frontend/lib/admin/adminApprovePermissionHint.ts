"use client";

import { useCallback, useEffect, useState } from "react";

import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";

const DISMISS_KEY = "tt_admin_approve_banner_dismiss";

/** 顶栏统一权限提示 + 首页待办回退链（互斥，避免三重重复）。 */
export function useAdminApprovePermissionHint() {
  const caps = useAdminCapabilities();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  const lacksApprove =
    caps.permissionsLoaded &&
    !caps.capabilitiesUnavailable &&
    !caps.hasPermission(ADMIN_PERM.APPROVE);

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }, []);

  return {
    lacksApprove,
    showShellBanner: lacksApprove && !dismissed,
    showInboxFallback: lacksApprove && dismissed,
    dismiss,
  };
}
