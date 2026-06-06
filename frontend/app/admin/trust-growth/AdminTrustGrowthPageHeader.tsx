"use client";

import Link from "next/link";

import { AdminObservabilitySectionBackLinks } from "@/components/admin/AdminObservabilitySectionBackLinks";
import { useTranslation } from "@/components/LocaleProvider";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { ADMIN_SHELL_SECONDARY_BTN_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";
type AdminTrustGrowthPageHeaderProps = {
  pageTitleId: string;
  loading: boolean;
  load: () => void;
};

export function AdminTrustGrowthPageHeader({
  pageTitleId,
  loading,
  load,
}: AdminTrustGrowthPageHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
          {t("admin_trust_growth_title")}
        </h1>
        <p className="mt-2 text-body text-ink-600">{t("admin_trust_growth_subtitle_l5")}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <AdminObservabilitySectionBackLinks>
        <button
          type="button"
          className={`${touchTargetLink44Classes} ${ADMIN_SHELL_SECONDARY_BTN_CLASS}`}
          onClick={() => load()}
          disabled={loading}
        >
          {t("admin_trust_growth_refresh")}
        </button>
        </AdminObservabilitySectionBackLinks>
      </div>
    </header>
  );
}
