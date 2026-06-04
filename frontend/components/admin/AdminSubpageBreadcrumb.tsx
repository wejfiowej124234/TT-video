"use client";

import { adminPageNavLinkClass } from "@/lib/adminUi";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import { adminShellContextForPath, adminBreadcrumbLeafForPath } from "@/lib/admin/adminShellContextForPath";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

/** 子页统一面包屑：工作台 → Shell 分组（P-04 · ① L5）。 */
export function AdminSubpageBreadcrumb() {
  const { t } = useTranslation();
  const pathname = usePathname() ?? "";
  const ctx = adminShellContextForPath(pathname);
  const leafKey = adminBreadcrumbLeafForPath(pathname);
  const onWorkspace = pathname === "/admin";

  return (
    <nav
      className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-small text-ink-600"
      aria-label={t("admin_queue_nav_aria")}
      data-tt-admin-subpage-breadcrumb="1"
    >
      {onWorkspace ? (
        <span className="font-medium text-ink-800" aria-current="page">
          {t("admin_shell_nav_workspace")}
        </span>
      ) : (
        <Link
          href="/admin"
          className={`${adminPageNavLinkClass()}`}
        >
          {t("admin_schema_back")}
        </Link>
      )}
      {ctx && !onWorkspace ? (
        <>
          <span className="text-ink-300" aria-hidden>
            /
          </span>
          {leafKey && leafKey !== ctx.groupLabelKey ? (
            <>
              <span
                className="font-medium text-ink-600"
                data-tt-admin-subpage-shell-group={ctx.groupId}
              >
                {t(ctx.groupLabelKey)}
              </span>
              <span className="text-ink-300" aria-hidden>
                /
              </span>
              <span className="font-medium text-ink-800" aria-current="page">
                {t(leafKey)}
              </span>
            </>
          ) : (
            <span
              className="font-medium text-ink-800"
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
