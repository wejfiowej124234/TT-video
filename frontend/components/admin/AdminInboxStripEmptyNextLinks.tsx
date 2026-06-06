"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import type { AdminEmptyNextLink } from "@/lib/admin/adminListEmptyStateNextLinks";
import { adminPageNavLinkClass,
  ADMIN_INNER_DIVIDER_CLASS,} from "@/lib/adminUi";

/** 队列 inbox strip 筛选空时 · 紧凑下一步链（与 `AdminListPageEmptyState` SSOT 同源）。 */
export function AdminInboxStripEmptyNextLinks(props: {
  nextLinks: AdminEmptyNextLink[];
  dataAttr: string;
}) {
  const { t } = useTranslation();
  const { nextLinks, dataAttr } = props;

  if (nextLinks.length === 0) return null;

  return (
    <div className={`mt-3 ${ADMIN_INNER_DIVIDER_CLASS} pt-3`} data-tt-admin-inbox-strip-empty-next={dataAttr}>
      <p className="text-meta text-ink-500">{t("admin_list_empty_next")}</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {nextLinks.map(({ href, labelKey }) => (
          <li key={href}>
            <Link href={href} className={adminPageNavLinkClass()}>
              {t(labelKey)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
