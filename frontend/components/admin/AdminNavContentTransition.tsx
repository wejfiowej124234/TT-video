"use client";



import { usePathname, useRouter } from "next/navigation";

import { useEffect, useRef, useState, type ReactNode } from "react";



import AdminRouteSegmentLoading from "@/components/admin/AdminRouteSegmentLoading";

import { adminNavBootReady } from "@/lib/admin/adminNavBootReady";

import { prefetchAdminShellHref } from "@/lib/admin/adminShellPrefetchHref";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";



function isEmptyNavChild(node: ReactNode): boolean {

  if (node == null || node === false) return true;

  if (Array.isArray(node)) return node.length === 0 || node.every(isEmptyNavChild);

  return false;

}



function normalizeAdminHref(href: string): string {

  return href.split("?")[0]?.split("#")[0] ?? href;

}



/** 子页切页 stale-while-navigate：保留上一页 + 顶栏进度，直至新页身挂载。 */

export function AdminNavContentTransition({ children }: { children: ReactNode }) {

  const pathname = usePathname() ?? "";

  const router = useRouter();

  const caps = useAdminCapabilities();

  const bootReady = adminNavBootReady(caps);

  const frozenRef = useRef<{ pathname: string; node: ReactNode } | null>(null);

  const settledPathRef = useRef(pathname);

  const [navTarget, setNavTarget] = useState<string | null>(null);

  const [pending, setPending] = useState(false);



  const hasChild = !isEmptyNavChild(children);



  useEffect(() => {
    if (!caps.capabilitiesUnavailable) return;
    setNavTarget(null);
    setPending(false);
  }, [caps.capabilitiesUnavailable]);

  useEffect(() => {
    if (!bootReady) return;

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a[href^="/admin"]');
      if (!anchor || !(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      const next = normalizeAdminHref(href);
      if (next === normalizeAdminHref(pathname)) return;
      setNavTarget(next);
      setPending(true);
      try {
        prefetchAdminShellHref(router, href);
      } catch {
        /* noop */
      }
    };

    document.addEventListener("click", onClick, false);
    return () => document.removeEventListener("click", onClick, false);
  }, [bootReady, pathname, router]);

  useEffect(() => {
    if (!pending) return;
    const timer = window.setTimeout(() => {
      setPending(false);
      setNavTarget(null);
    }, 12_000);
    return () => window.clearTimeout(timer);
  }, [pending, pathname]);



  useEffect(() => {

    if (!hasChild) return;

    frozenRef.current = { pathname, node: children };

    settledPathRef.current = pathname;

    setNavTarget(null);

    setPending(false);

  }, [pathname, children, hasChild]);



  if (!bootReady) {

    return <>{children}</>;

  }



  const pathDrift = pathname !== settledPathRef.current;
  const targetDrift = navTarget != null && navTarget !== normalizeAdminHref(pathname);
  const inFlight = pending || targetDrift || (pathDrift && !hasChild);
  const blockInteraction = pathDrift || targetDrift || (pathDrift && !hasChild);
  const frozen = frozenRef.current;

  if (inFlight && frozen) {
    return (
      <div className="relative min-h-0" data-tt-admin-nav-transition="1">
        <div
          aria-hidden={blockInteraction}
          data-tt-admin-nav-frozen="1"
          className={blockInteraction ? "pointer-events-none opacity-[0.78] motion-reduce:opacity-100" : undefined}
        >
          {frozen.node}

        </div>

        <div

          className="pointer-events-none absolute inset-x-0 top-0 z-20"

          data-tt-admin-nav-pending="1"

          aria-hidden

        >

          <AdminRouteSegmentLoading />

        </div>

      </div>

    );

  }



  return <>{children}</>;

}


