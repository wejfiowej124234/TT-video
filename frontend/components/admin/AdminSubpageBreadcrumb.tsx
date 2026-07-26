"use client";

import { adminPageNavLinkClass,
  ADMIN_BREADCRUMB_GROUP_CLASS,
  ADMIN_BREADCRUMB_LEAF_CLASS,
  ADMIN_BREADCRUMB_SEPARATOR_CLASS,} from "@/lib/adminUi";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import { adminPathShowsInboxBreadcrumb } from "@/lib/admin/adminInboxQueuePath";
import { adminShellContextForPath, adminBreadcrumbLeafForPath } from "@/lib/admin/adminShellContextForPath";
import { useAdminShellLinkPrefetch } from "@/lib/admin/useAdminShellLinkPrefetch";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

/** 子页统一面包屑：工作台 → Shell 分组（P-04 · ① L5）。 */
export function AdminSubpageBreadcrumb() {
  const { t } = useTranslation();
  const pathname = usePathname() ?? "";
  const workspacePrefetch = useAdminShellLinkPrefetch("/admin");
  const inboxPrefetch = useAdminShellLinkPrefetch("/admin/inbox");
  const ctx = adminShellContextForPath(pathname);
  const leafKey = adminBreadcrumbLeafForPath(pathname);
  const onWorkspace = pathname === "/admin";
  const onInbox = pathname === "/admin/inbox";
  const showInboxCrumb = adminPathShowsInboxBreadcrumb(pathname) && !onInbox;

  return (
    <nav
      className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-small"
      aria-label={t("admin_queue_nav_aria")}
      data-tt-admin-subpage-breadcrumb="1"
    >
      {onWorkspace ? (
        <span className={ADMIN_BREADCRUMB_LEAF_CLASS} aria-current="page">
          {t("admin_shell_nav_workspace")}
        </span>
      ) : (
        <Link href="/admin" {...workspacePrefetch} className={adminPageNavLinkClass()}>
          {t("admin_shell_nav_workspace")}
        </Link>
      )}
      {showInboxCrumb ? (
        <>
          <span className={ADMIN_BREADCRUMB_SEPARATOR_CLASS} aria-hidden>
            /
          </span>
          <Link
            href="/admin/inbox"
            {...inboxPrefetch}
            className={adminPageNavLinkClass()}
            data-tt-admin-subpage-breadcrumb-inbox="1"
          >
            {t("admin_unified_inbox_nav_short")}
          </Link>
        </>
      ) : null}
      {ctx && !onWorkspace ? (
        <>
          <span className={ADMIN_BREADCRUMB_SEPARATOR_CLASS} aria-hidden>
            /
          </span>
          {leafKey && leafKey !== ctx.groupLabelKey ? (
            <>
              {/* Batch-10 HU-236：收件箱队列已有 Inbox 段时不再渲染 Shell 组（禁「入驻」错挂）。 */}
              {!showInboxCrumb ? (
                <>
                  <span
                    className={ADMIN_BREADCRUMB_GROUP_CLASS}
                    data-tt-admin-subpage-shell-group={ctx.groupId}
                  >
                    {t(ctx.groupLabelKey)}
                  </span>
                  <span className={ADMIN_BREADCRUMB_SEPARATOR_CLASS} aria-hidden>
                    /
                  </span>
                </>
              ) : null}
              <span className={ADMIN_BREADCRUMB_LEAF_CLASS} aria-current="page">
                {t(leafKey)}
              </span>
            </>
          ) : (
            <span
              className={ADMIN_BREADCRUMB_LEAF_CLASS}
              data-tt-admin-subpage-shell-group={ctx.groupId}
              aria-current="page"
            >
              {t(ctx.groupLabelKey)}
            </span>
          )}
        </>
      ) : null}
    </nav>
  );
}
