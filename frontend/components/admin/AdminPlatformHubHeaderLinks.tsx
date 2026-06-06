"use client";

import Link from "next/link";

import { AdminInboxQueueBackLinks } from "@/components/admin/AdminInboxQueueBackLinks";
import { useTranslation } from "@/components/LocaleProvider";
import { ADMIN_PLATFORM_HUB_HEADER_LINKS } from "@/lib/admin/adminPlatformHubHeaderNav";
import { adminPageNavLinkClass } from "@/lib/adminUi";

const HUB_INBOX_HREF = "/admin/inbox";
const HUB_WORKSPACE_HREF = "/admin";

/** 枢纽页 `headerAside` · 收件箱回链 SSOT + 交叉枢纽（排除当前页与重复 inbox/工作台）。 */
export function AdminPlatformHubHeaderLinks(props: { excludeHref?: string }) {
  const { t } = useTranslation();
  const { excludeHref } = props;
  const links = ADMIN_PLATFORM_HUB_HEADER_LINKS.filter(
    (l) =>
      l.href !== excludeHref && l.href !== HUB_INBOX_HREF && l.href !== HUB_WORKSPACE_HREF,
  );

  return (
    <>
      <AdminInboxQueueBackLinks />
      {links.map(({ href, labelKey }) => (
        <Link key={href} href={href} className={adminPageNavLinkClass()}>
          {t(labelKey)}
        </Link>
      ))}
    </>
  );
}
