"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { AdminSubpageBreadcrumb } from "@/components/admin/AdminSubpageBreadcrumb";
import { TT_ADMIN_LAYOUT_GUTTER } from "@/lib/adminUi";

function shouldSkipPath(pathname: string): boolean {
  if (pathname === "/admin") return true;
  if (pathname.startsWith("/admin/provider-applications")) return true;
  if (pathname.startsWith("/admin/steward-applications")) return true;
  return false;
}

function pageAlreadyHasWorkspaceBack(): boolean {
  if (typeof document === "undefined") return false;
  if (document.querySelector('[data-tt-admin-subpage-breadcrumb="1"]')) return true;
  if (document.querySelector("[data-tt-admin-queue-list]")) return true;
  return document.querySelector('main nav a[href="/admin"], main header a[href="/admin"]') !== null;
}

/** 子页缺省「返回工作台」时由 layout 注入；已有面包屑/队列 chrome/页头返回链时不重复。 */
export function AdminLayoutSubpageNav() {
  const pathname = usePathname() ?? "";
  const [hide, setHide] = useState(true);

  useEffect(() => {
    if (shouldSkipPath(pathname)) {
      setHide(true);
      return;
    }
    setHide(pageAlreadyHasWorkspaceBack());
  }, [pathname]);

  if (shouldSkipPath(pathname) || hide) return null;

  return (
    <div
      className={`${TT_ADMIN_LAYOUT_GUTTER} pt-3`}
      data-tt-admin-layout-breadcrumb="1"
    >
      <AdminSubpageBreadcrumb />
    </div>
  );
}
