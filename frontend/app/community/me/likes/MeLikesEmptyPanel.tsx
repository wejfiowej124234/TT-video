import { TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";
import Link from "next/link";
import { communityCyanPillFocus } from "@/lib/communityA11yFocus";

/** 88 §3.2：赞过列表空态 — 与收藏/举报页结构化空态同口径 */
export function MeLikesEmptyPanel({ t }: { t: (k: string) => string }) {
  return (
    <div
      className="rounded-[var(--radius-md)] border border-dashed border-ref-sun/30 bg-ink-900/45 px-5 py-10 text-center space-y-4"
      role="region"
      aria-label={t("community_me_likes_empty")}
    >
      <div
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-ref-sun/28 bg-ref-sun/10 text-ref-sun"
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          />
        </svg>
      </div>
      <p className="text-body text-slate-200">{t("community_me_likes_empty")}</p>
      <p className="text-meta text-slate-400 max-w-md mx-auto">{t("community_me_likes_empty_hint")}</p>
      <div className="flex flex-wrap justify-center gap-3 pt-1">
        <Link href="/community" className={`${TT_COMMUNITY_PAGE_L5.pill} ${communityCyanPillFocus}`}>
          {t("community_tab_feed")}
        </Link>
        <Link href="/community/explore" className={`${TT_COMMUNITY_PAGE_L5.primaryCtaFilled} ${communityCyanPillFocus}`}>
          {t("community_explore_title")}
        </Link>
      </div>
    </div>
  );
}
