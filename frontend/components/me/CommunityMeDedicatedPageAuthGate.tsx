"use client";

import Link from "next/link";
import { TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";
import { communityCyanPillFocus } from "@/lib/communityA11yFocus";

/** `/community/me/posts` · `/community/me/collects` 等独立页：与 reports 页同口径登录闸 */
export function CommunityMeDedicatedPageAuthGate({
  t,
  isLoggedIn,
  authPending,
  pageDataAttr,
  surfaceDataAttr,
  ariaLabel,
  loginRequiredKey,
  loginReturnPath,
}: {
  t: (k: string) => string;
  isLoggedIn: boolean;
  authPending: boolean;
  pageDataAttr: string;
  surfaceDataAttr: string;
  ariaLabel: string;
  loginRequiredKey: string;
  loginReturnPath: string;
}) {
  if (authPending) {
    return (
      <main
        data-tt-community-me-page={pageDataAttr}
        className="max-w-4xl mx-auto px-3 py-6 pb-24 safe-area-pb"
        aria-busy="true"
        aria-label={ariaLabel}
      >
        <div className="mb-6 h-9 w-48 max-w-[55%] rounded-[var(--radius-sm)] bg-ink-600/40 animate-pulse motion-reduce:animate-none" />
        <div className="min-h-[12rem] rounded-[var(--radius-md)] border border-ref-sun/18 bg-ink-800/50 backdrop-blur-md animate-pulse motion-reduce:animate-none" />
      </main>
    );
  }

  if (!isLoggedIn) {
    return (
      <main
        data-tt-community-me-page={pageDataAttr}
        className="max-w-4xl mx-auto px-3 py-8 pb-24 safe-area-pb"
        aria-label={ariaLabel}
      >
        <section
          data-tt-community-me-surface={surfaceDataAttr}
          data-tt-data-state="invalid"
          className="rounded-[var(--radius-md)] border border-ref-sun/28 bg-ink-800/70 backdrop-blur-md px-6 py-10 text-center space-y-4"
          role="region"
          aria-label={ariaLabel}
        >
          <p className="text-body text-slate-200">{t(loginRequiredKey)}</p>
          <Link
            href={`/auth/login?returnUrl=${encodeURIComponent(loginReturnPath)}`}
            className={`${TT_COMMUNITY_PAGE_L5.pill} motion-reduce:transition-none ${communityCyanPillFocus}`}
          >
            {t("community_activity_go_login")}
          </Link>
        </section>
      </main>
    );
  }

  return null;
}
