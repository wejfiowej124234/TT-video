"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import { ADMIN_BTN_SECONDARY_CLASS } from "@/lib/adminUi";

/** 列表空态 + 「下一步」引导（HON-04 · Batch-10 W14 HU-240：次 CTA 按钮化）。 */
export function AdminListPageEmptyState(props: {
  messageKey: string;
  hintKey?: string;
  nextLinks?: { href: string; labelKey: string }[];
  className?: string;
  /** 与 inbox strip `data-tt-admin-*-inbox-empty` 对拍 · 筛选后无结果 */
  filteredEmpty?: boolean;
}) {
  const { t } = useTranslation();
  const { messageKey, hintKey, nextLinks = [], className = "", filteredEmpty = false } = props;

  return (
    <AdminWarmL5Surface
      className={`mt-6 text-center ${className}`.trim()}
      innerClassName="text-center"
      role="status"
      data-tt-admin-list-empty="1"
      data-tt-admin-list-empty-widget="1"
      data-tt-admin-list-empty-filtered={filteredEmpty ? "1" : undefined}
    >
      <p className="text-body text-ink-600">{t(messageKey)}</p>
      {hintKey ? <p className="mt-2 text-small text-ink-500">{t(hintKey)}</p> : null}
      {nextLinks.length > 0 ? (
        <p className="mt-3 text-small text-ink-500">{t("admin_list_empty_next")}</p>
      ) : null}
      <ul className="mt-3 flex flex-wrap justify-center gap-3" data-tt-admin-list-empty-cta="btn">
        {nextLinks.map(({ href, labelKey }) => (
          <li key={href}>
            <Link
              href={href}
              className={ADMIN_BTN_SECONDARY_CLASS}
              data-tt-admin-list-empty-next-btn="1"
            >
              {t(labelKey)}
            </Link>
          </li>
        ))}
      </ul>
    </AdminWarmL5Surface>
  );
}
