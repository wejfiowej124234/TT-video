"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { adminPageNavLinkClass, ADMIN_HOME_WIDGET_CARD_CLASS } from "@/lib/adminUi";

/** 列表空态 + 「下一步」引导（HON-04）。 */
export function AdminListPageEmptyState(props: {
  messageKey: string;
  nextLinks?: { href: string; labelKey: string }[];
  className?: string;
  /** 与 inbox strip `data-tt-admin-*-inbox-empty` 对拍 · 筛选后无结果 */
  filteredEmpty?: boolean;
}) {
  const { t } = useTranslation();
  const { messageKey, nextLinks = [], className = "", filteredEmpty = false } = props;

  return (
    <div
      className={`mt-6 text-center ${ADMIN_HOME_WIDGET_CARD_CLASS} ${className}`.trim()}
      role="status"
      data-tt-admin-list-empty="1"
      data-tt-admin-list-empty-widget="1"
      data-tt-admin-list-empty-filtered={filteredEmpty ? "1" : undefined}
    >
      <p className="text-body text-ink-600">{t(messageKey)}</p>
      {nextLinks.length > 0 ? (
        <p className="mt-3 text-small text-ink-500">{t("admin_list_empty_next")}</p>
      ) : null}
      <ul className="mt-3 flex flex-wrap justify-center gap-3">
        {nextLinks.map(({ href, labelKey }) => (
          <li key={href}>
            <Link
              href={href}
              className={adminPageNavLinkClass()}
            >
              {t(labelKey)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
