"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { ADMIN_COMMUNITY_SUBNAV_FOLD_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";

export type AdminOpsDetailRelatedLink = { href: string; labelKey: string; dataTt?: string };

/** 运维详情页 · 折叠交叉入口（顶栏仅保留队列回链 + 收件箱）。 */
export function AdminOpsDetailRelatedFold(props: {
  relatedLinks: readonly AdminOpsDetailRelatedLink[];
  ariaLabelKey: string;
  foldSummaryKey: string;
  dataTtFold: string;
}) {
  const { t } = useTranslation();

  return (
    <nav className="mb-4" aria-label={t(props.ariaLabelKey)} data-tt-admin-ops-detail-related-fold={props.dataTtFold}>
      <details className={ADMIN_COMMUNITY_SUBNAV_FOLD_CLASS}>
        <summary className="cursor-pointer text-small font-medium text-ink-700">
          {t(props.foldSummaryKey)}
        </summary>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-small">
          {props.relatedLinks.map(({ href, labelKey, dataTt }) => (
            <li key={href}>
              <Link
                href={href}
                className={adminPageNavLinkClass()}
                {...(dataTt ? { [`data-tt-${dataTt}`]: "1" } : {})}
              >
                {t(labelKey)}
              </Link>
            </li>
          ))}
        </ul>
      </details>
    </nav>
  );
}
