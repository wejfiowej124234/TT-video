"use client";



import { useEffect } from "react";

import { usePathname, useRouter } from "next/navigation";



import { scheduleAdminDeferredShellWork } from "@/lib/admin/adminDeferredShellWork";

import { prefetchAdminRoutesBatched } from "@/lib/admin/adminNavPrefetchBatch";

import { adminRecentVisitHref, getAdminRecentVisits, recordAdminRecentVisit } from "@/lib/admin/adminRecentVisits";



/** ① 记录最近访问 + idle 预热最近 4 条子路由。 */

export function AdminRecentVisitsTracker() {

  const pathname = usePathname() ?? "";

  const router = useRouter();



  useEffect(() => {

    recordAdminRecentVisit(pathname);

    if (!pathname.startsWith("/admin")) return;



    const cancel = scheduleAdminDeferredShellWork(() => {

      const hrefs = getAdminRecentVisits(4).map((v) => adminRecentVisitHref(v.path));

      prefetchAdminRoutesBatched(router, hrefs, { batchSize: 2, gapMs: 36 });

    }, { timeoutMs: 720 });



    return cancel;

  }, [pathname, router]);



  return null;

}


