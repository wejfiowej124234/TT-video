"use client";

import { AdminInboxQueueBackLinks } from "@/components/admin/AdminInboxQueueBackLinks";
import { AdminObservabilityHubRelatedNav } from "@/components/admin/AdminObservabilityHubRelatedNav";
import { useTranslation } from "@/components/LocaleProvider";

type Props = {
  pageTitleId: string;
};

export function AdminObservabilityPageHeader({ pageTitleId }: Props) {
  const { t } = useTranslation();

  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
          {t("admin_observability_title")}
        </h1>
        <p className="mt-1 text-body text-ink-600">{t("admin_observability_subtitle_l5")}</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-small">
        <AdminInboxQueueBackLinks />
      </div>
      <AdminObservabilityHubRelatedNav />
    </header>
  );
}
