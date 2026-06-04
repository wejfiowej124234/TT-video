"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { AdminPageAccessBadge } from "@/components/admin/AdminPageAccessBadge";
import { AdminSubpageBreadcrumb } from "@/components/admin/AdminSubpageBreadcrumb";
import type { AdminPermissionId } from "@/lib/admin/adminPermissionIds";
import { adminWritePermissionForPathname } from "@/lib/admin/adminListPageWritePermission";
import { TT_ADMIN_PAGE_INNER_LIST, ADMIN_PAGE_HEADER_CARD_CLASS, ADMIN_LIST_PAGE_BODY_CANVAS_CLASS } from "@/lib/adminUi";

/** 列表页 L5 壳：页头卡片 + 子内容（筛选 / 表格 / 空态）。 */
export function AdminListPageChrome(props: {
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
      className={innerClass ?? TT_ADMIN_PAGE_INNER_LIST}
      aria-labelledby={titleId}
      data-tt-admin-list-page="1"
      data-tt-admin-app-page="1"
      {...mainDataAttrs}
    >
      {showSubpageBreadcrumb !== false ? <AdminSubpageBreadcrumb /> : null}
      {preHeader}
      <header className={`${ADMIN_PAGE_HEADER_CARD_CLASS} flex flex-wrap items-start justify-between gap-3`}>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 id={titleId} className="text-h3 font-semibold text-ink-900">
              {title}
            </h1>
            <AdminPageAccessBadge writePermissionId={resolvedWrite} />
          </div>
          {subtitle ? <div className="mt-2 max-w-2xl text-body text-ink-600">{subtitle}</div> : null}
        </div>
        {headerAside ? <div className="flex flex-wrap gap-2">{headerAside}</div> : null}
      </header>
      <div
        className={ADMIN_LIST_PAGE_BODY_CANVAS_CLASS}
        data-tt-admin-list-page-body-canvas="1"
      >
        {children}
      </div>
    </main>
  );
}
