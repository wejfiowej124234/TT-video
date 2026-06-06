"use client";

import MeSettingsL5FlowPage from "@/components/me/MeSettingsL5FlowPage";
import { MeSettingsProfileCardSkeleton } from "@/components/me/MeSettingsProfileCard";
import { useTranslation } from "@/components/LocaleProvider";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";

export default function MeSettingsLoading() {
  const { t } = useTranslation();
  return (
    <MeSettingsL5FlowPage ariaLabel={t("me_settings_pageTitle")} route="settings-loading">
      <div role="status" aria-busy="true" aria-label={t("me_settings_pageTitle")}>
        <div className="mb-2 h-4 w-28 rounded bg-ref-sun/10 animate-pulse" aria-hidden />
        <div className="h-8 w-36 rounded bg-ref-sun/15 animate-pulse mb-2" aria-hidden />
        <div className="h-4 max-w-md w-full rounded bg-slate-700/50 animate-pulse mb-6" aria-hidden />
        <MeSettingsProfileCardSkeleton />
        {[1, 2, 3].map((i) => (
          <div key={i} className="mt-5 space-y-2" aria-hidden>
            <div className="h-3 w-16 rounded bg-ref-sun/10 animate-pulse" />
            <div className={`${TT_ME_SETTINGS_L5.sectionCard} space-y-0 p-0`}>
              <div className="h-12 border-b border-ref-sun/10 bg-ref-sun/[0.03] animate-pulse" />
              <div className="h-12 border-b border-ref-sun/10 bg-ref-sun/[0.03] animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </MeSettingsL5FlowPage>
  );
}
