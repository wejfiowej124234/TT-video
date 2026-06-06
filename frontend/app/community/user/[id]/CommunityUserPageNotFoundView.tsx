"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { communityCyanPillFocus } from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";

export function CommunityUserPageNotFoundView() {
  const { t } = useTranslation();
  return (
    <main
      className="max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-6 pb-24 safe-area-pb"
      aria-label={t("community_user_not_found")}
      data-tt-community-user-page="1"
    >
      <h1 className="sr-only">{t("community_user_not_found")}</h1>
      <div className="rounded-[var(--radius-md)] border border-ref-sun/25 bg-ink-900/70 px-6 py-12 text-center">
        <p className="text-body text-slate-300">{t("community_user_not_found")}</p>
        <Link
          href="/community"
          className={`mt-4 ${TT_COMMUNITY_PAGE_L5.pill} ${communityCyanPillFocus}`}
        >
          {t("community_tab_feed")}
        </Link>
      </div>
    </main>
  );
}
