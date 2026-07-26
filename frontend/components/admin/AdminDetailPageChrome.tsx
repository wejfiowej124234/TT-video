"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { AdminPageAccessBadge } from "@/components/admin/AdminPageAccessBadge";
import { AdminSubpageBreadcrumb } from "@/components/admin/AdminSubpageBreadcrumb";
import type { AdminPermissionId } from "@/lib/admin/adminPermissionIds";
import { adminWritePermissionForPathname } from "@/lib/admin/adminListPageWritePermission";
import {
  ADMIN_LIST_PAGE_BODY_CANVAS_CLASS,
  ADMIN_PAGE_CHROME_SUBTITLE_CLASS,
  ADMIN_PAGE_CHROME_TITLE_CLASS,
  ADMIN_PAGE_HEADER_FLAT_CLASS,
  TT_ADMIN_PAGE_INNER_DETAIL,
} from "@/lib/adminUi";

/** 详情 / 写表单页 L5 壳：扁平页头（W12 · HU-237）+ 子内容（表单 / 时间线 / 只读块）。 */
export function AdminDetailPageChrome(props: {
  titleId: string;
  title: ReactNode;
  subtitle?: ReactNode;
  headerAside?: ReactNode;
  preHeader?: ReactNode;
  children: ReactNode;
  innerClass?: string;
  /** VIS-03：页头只读/可写徽章；未传且 `inferWritePermission` 时按 pathname 推断。 */
  writePermissionId?: AdminPermissionId;
  inferWritePermission?: boolean;
  /** 默认 true；Shell 分组面包屑（ADM-UX-SHELL-03）。 */
  showSubpageBreadcrumb?: boolean;
  /** 额外 `main` data 属性（hub marker 等 · 契约测试）。 */
  mainDataAttrs?: Record<string, string>;
}) {
  const {
    titleId,
    title,
    subtitle,
    headerAside,
    preHeader,
    children,
    innerClass,
    writePermissionId,
    inferWritePermission = true,
    showSubpageBreadcrumb = true,
    mainDataAttrs,
  } = props;

  const pathname = usePathname() ?? "";
  const resolvedWrite =
    writePermissionId ??
    (inferWritePermission ? adminWritePermissionForPathname(pathname) : undefined);

  return (
    <main
      className={innerClass ?? TT_ADMIN_PAGE_INNER_DETAIL}
      aria-labelledby={titleId}
      data-tt-admin-detail-page="1"
      data-tt-admin-app-page="1"
      {...mainDataAttrs}
    >
      {showSubpageBreadcrumb !== false ? <AdminSubpageBreadcrumb /> : null}
      {preHeader}
      <header
        className={`${ADMIN_PAGE_HEADER_FLAT_CLASS} flex flex-wrap items-start justify-between gap-3`}
        data-tt-admin-detail-page-header="1"
        data-tt-admin-page-header-flat="1"
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 id={titleId} className={ADMIN_PAGE_CHROME_TITLE_CLASS}>
              {title}
            </h1>
            <AdminPageAccessBadge writePermissionId={resolvedWrite} />
          </div>
          {subtitle ? <div className={ADMIN_PAGE_CHROME_SUBTITLE_CLASS}>{subtitle}</div> : null}
        </div>
        {headerAside ? <div className="flex flex-wrap gap-2">{headerAside}</div> : null}
      </header>
      <div
        className={ADMIN_LIST_PAGE_BODY_CANVAS_CLASS}
        data-tt-admin-detail-page-body-canvas="1"
      >
        {children}
      </div>
    </main>
  );
}
