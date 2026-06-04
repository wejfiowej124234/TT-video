"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";
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
        <p className="mt-2 text-body text-ink-600">{t("admin_trust_growth_subtitle")}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={`rounded-[var(--radius-md)] border border-ink-200 bg-white px-3 py-2 text-small font-medium text-ink-800 hover:border-ink-400 ${ADMIN_LINK_FOCUS_CLASS}`}
          onClick={() => load()}
          disabled={loading}
        >
          {t("admin_trust_growth_refresh")}
        </button>
        <Link
          href="/admin"
          className={`${adminPageNavLinkClass()}`}
        >
          {t("admin_schema_back")}
        </Link>
      </div>
    </header>
  );
}
