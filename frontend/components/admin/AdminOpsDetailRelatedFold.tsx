"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { ADMIN_OPS_RELATED_FOLD_FLAT_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";

export type AdminOpsDetailRelatedLink = { href: string; labelKey: string; dataTt?: string };

/** 运维详情页 · 折叠交叉入口（顶栏仅保留队列回链 + 收件箱）。默认关闭 · 无描边卡（W12 · HU-237）。 */
export function AdminOpsDetailRelatedFold(props: {
  relatedLinks: readonly AdminOpsDetailRelatedLink[];
  ariaLabelKey: string;
  foldSummaryKey: string;
  dataTtFold: string;
}) {
  const { t } = useTranslation();

  return (
    <nav
      className="mb-3"
      aria-label={t(props.ariaLabelKey)}
      data-tt-admin-ops-detail-related-fold={props.dataTtFold}
      data-tt-admin-related-default-closed="1"
    >
      <details className={ADMIN_OPS_RELATED_FOLD_FLAT_CLASS}>
        <summary className="cursor-pointer text-small font-medium text-slate-400">
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
