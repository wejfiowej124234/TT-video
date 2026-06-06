"use client";

import { useId } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { ADMIN_HOME_CARDS, ADMIN_HOME_DEV_API_BY_HREF } from "@/lib/admin/adminHomeModel";
import { ADMIN_HOME_DEV_API_FOLD_CLASS } from "@/lib/adminUi";

/** ① 开发对照：REST 路径折叠区，不替代卡片业务描述。 */
export function AdminHomeDevApiReference() {
  const { t } = useTranslation();
  const summaryId = useId();

  return (
    <details className={ADMIN_HOME_DEV_API_FOLD_CLASS} data-tt-admin-home-dev-api="1">
      <summary
        id={summaryId}
        className="cursor-pointer text-small font-medium text-ink-700 hover:text-ink-900"
      >
        {t("admin_home_dev_api_summary")}
      </summary>
      <div className="mt-3 max-h-64 overflow-y-auto">
        <p className="text-meta text-ink-500">{t("admin_home_dev_api_title")}</p>
        <dl className="mt-2 space-y-1.5 text-meta font-mono text-ink-600">
          {ADMIN_HOME_CARDS.map(({ href, titleKey }) => {
            const api = ADMIN_HOME_DEV_API_BY_HREF[href];
            if (!api) return null;
            return (
              <div key={href} className="grid gap-0.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                <dt className="text-ink-500 sm:truncate">{t(titleKey)}</dt>
                <dd>{api}</dd>
              </div>
            );
          })}
        </dl>
      </div>
    </details>
  );
}
