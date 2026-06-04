"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";
type Props = { pageTitleId: string };

export function AdminMediaAccessLogsPageHeader({ pageTitleId }: Props) {
  const { t } = useTranslation();

  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
          {t("admin_media_access_logs_title")}
        </h1>
        <p className="mt-1 text-body text-ink-600">{t("admin_media_access_logs_subtitle")}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-small">
        <Link
          href="/admin/observability"
          className={`${adminPageNavLinkClass()}`}
        >
          {t("admin_observability_title")}
        </Link>
        <Link href="/admin/media/signed-url-tokens" className={`${adminPageNavLinkClass()}`}>
          {t("admin_media_access_logs_link_tokens")}
        </Link>
        <Link href="/admin" className={`${adminPageNavLinkClass()}`}>
          {t("admin_media_access_logs_back")}
        </Link>
      </div>
    </header>
  );
}
