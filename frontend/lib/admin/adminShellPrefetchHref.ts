type AdminRouterLike = {

  prefetch: (href: string) => void;

};



/** 安全 prefetch · 仅 Admin 域（含 `/` 外链回站点）。 */

export function prefetchAdminShellHref(router: AdminRouterLike, href: string): void {

  if (typeof window === "undefined") return;

  const path = href.split("?")[0]?.split("#")[0] ?? href;

  if (!path.startsWith("/admin") && path !== "/") return;

  try {

    router.prefetch(href);

  } catch {

    /* noop */

  }

}



/** 侧栏 / 顶栏 / 面包屑 Link 统一预热处理器。 */

export function adminShellLinkPrefetchProps(router: AdminRouterLike, href: string) {

  return {

    prefetch: true as const,

    onPointerDown: () => prefetchAdminShellHref(router, href),

    onPointerEnter: () => prefetchAdminShellHref(router, href),

  };

}


