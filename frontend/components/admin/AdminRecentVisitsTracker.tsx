"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { recordAdminRecentVisit } from "@/lib/admin/adminRecentVisits";

/** ① 记录最近访问的 Admin 子路由（localStorage）。 */
export function AdminRecentVisitsTracker() {
  const pathname = usePathname() ?? "";

  useEffect(() => {
    recordAdminRecentVisit(pathname);
  }, [pathname]);

  return null;
}
