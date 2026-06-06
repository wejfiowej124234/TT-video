"use client";



import { useRouter } from "next/navigation";

import { useCallback } from "react";



import { adminShellLinkPrefetchProps, prefetchAdminShellHref } from "@/lib/admin/adminShellPrefetchHref";



/** 返回可 spread 到 `<Link>` 的 prefetch 处理器。 */

export function useAdminShellLinkPrefetch(href: string) {

  const router = useRouter();

  return adminShellLinkPrefetchProps(router, href);

}



/** 命令面板 / 程序化跳转前预热。 */

export function useAdminShellPrefetchHref() {

  const router = useRouter();

  return useCallback((href: string) => prefetchAdminShellHref(router, href), [router]);

}


