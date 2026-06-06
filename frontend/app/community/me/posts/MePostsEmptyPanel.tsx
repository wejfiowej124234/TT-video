import { TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";
import Link from "next/link";
import { communityCyanPillFocus } from "@/lib/communityA11yFocus";

/** 88 §3.2：我的帖子空态 — 双 CTA（发帖 / 发现）与可见性 Tab 44px 同批 */
export function MePostsEmptyPanel({ t }: { t: (k: string) => string }) {
  return (
    <div
      className="rounded-[var(--radius-md)] border border-dashed border-ref-sun/30 bg-ink-900/45 px-5 py-10 text-center space-y-4"
      role="region"
      aria-label={t("community_empty")}
    >
      <div
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-ref-sun/28 bg-ref-sun/10 text-ref-sun"
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
      </div>
      <p className="text-body text-slate-200">{t("community_empty")}</p>
      <p className="text-meta text-slate-400 max-w-md mx-auto">{t("community_me_posts_empty_hint")}</p>
      <div className="flex flex-wrap justify-center gap-3 pt-1">
        <Link
          href="/community?publish=1"
          className={`${TT_COMMUNITY_PAGE_L5.primaryCtaFilled} ${communityCyanPillFocus}`}
        >
          {t("community_me_posts_link_publish")}
        </Link>
        <Link
          href="/community"
          className={`${TT_COMMUNITY_PAGE_L5.pill} ${communityCyanPillFocus}`}
        >
          {t("community_empty_cta")}
        </Link>
        <Link
          href="/community/explore"
          className={`${TT_COMMUNITY_PAGE_L5.pill} ${communityCyanPillFocus}`}
        >
          {t("community_explore_title")}
        </Link>
      </div>
    </div>
  );
}
