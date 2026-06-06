"use client";

import { TT_COMMUNITY_ME_PANEL_L5, TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";

export default function CommunityMePageHeader({ t }: { t: (key: string) => string }) {
  return (
    <header className="mb-0.5 sm:mb-1">
      <p className={TT_COMMUNITY_ME_PANEL_L5.pageEyebrow}>
        {t("community_me_eyebrow_account")}
      </p>
      <h1 className={TT_COMMUNITY_PAGE_L5.pageTitle}>
        {t("me_title")}
      </h1>
      <p className="text-small text-slate-400 mt-1 max-w-2xl leading-relaxed">{t("community_me_hub_subtitle")}</p>
    </header>
  );
}
