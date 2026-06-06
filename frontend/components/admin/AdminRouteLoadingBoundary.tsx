"use client";



import AdminRouteSegmentLoading from "@/components/admin/AdminRouteSegmentLoading";

import { adminNavBootReady } from "@/lib/admin/adminNavBootReady";

import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";



/** Route `loading.tsx`：boot 已就绪时返回 null，由 AdminNavContentTransition 保留上一页。 */

export default function AdminRouteLoadingBoundary() {

  const caps = useAdminCapabilities();

  if (adminNavBootReady(caps)) return null;

  return <AdminRouteSegmentLoading />;

}


