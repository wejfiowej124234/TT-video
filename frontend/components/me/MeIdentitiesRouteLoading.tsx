"use client";

import { useTranslation } from "@/components/LocaleProvider";
import AuthL5PageBackdrop from "@/components/auth/AuthL5PageBackdrop";
import { meIdentitiesL5MainDataAttrs, TT_ME_IDENTITIES_L5 } from "@/lib/me/meIdentitiesL5";

/** `/me/identities` 段级 L5 骨架（2×2 卡片脉冲 · 无 Console 浅灰闪屏）。 */
export default function MeIdentitiesRouteLoading() {
  const { t } = useTranslation();
  return (
    <main
      className={TT_ME_IDENTITIES_L5.pageShell}
      role="status"
      aria-label={t("me_identities_hub_title")}
      aria-busy="true"
      data-tt-me-identities-surface="route_loading"
      {...meIdentitiesL5MainDataAttrs(true)}
    >
      <AuthL5PageBackdrop />
      <div className={TT_ME_IDENTITIES_L5.inner}>
        <div className={TT_ME_IDENTITIES_L5.headerBlock} aria-hidden>
          <div className={`h-3 w-40 ${TT_ME_IDENTITIES_L5.loadingPulse}`} />
          <div className={`mt-4 ${TT_ME_IDENTITIES_L5.loadingHeaderTitle}`} />
          <div className={TT_ME_IDENTITIES_L5.loadingHeaderSub} />
        </div>
        <div className={TT_ME_IDENTITIES_L5.loadingCallout} aria-hidden />
        <ul className={TT_ME_IDENTITIES_L5.loadingGrid} aria-hidden>
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i}>
              <div className={TT_ME_IDENTITIES_L5.loadingCard}>
                <div className={`h-5 w-28 ${TT_ME_IDENTITIES_L5.loadingPulse}`} />
                <div className={`mt-3 h-3 w-full ${TT_ME_IDENTITIES_L5.loadingPulse}`} />
                <div className={`mt-2 h-3 w-[80%] ${TT_ME_IDENTITIES_L5.loadingPulse}`} />
                <div className={`mt-5 h-4 w-20 ${TT_ME_IDENTITIES_L5.loadingPulse}`} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
