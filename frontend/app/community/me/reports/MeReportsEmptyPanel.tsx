import { TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";
import Link from "next/link";
import { communityCyanPillFocus } from "@/lib/communityA11yFocus";

/** 88 §3.2：我的举报列表空态 — 与消息/好友页结构化空态同口径 */
export function MeReportsEmptyPanel({ t }: { t: (k: string) => string }) {
  return (
    <div
      className="rounded-[var(--radius-md)] border border-dashed border-ref-sun/30 bg-ink-800/45 px-5 py-10 text-center space-y-4"
      role="region"
      aria-label={t("community_report_list_empty")}
    >
      <div
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-ref-sun/28 bg-ref-sun/10 text-ref-sun"
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>
      <p className="text-body text-slate-200">{t("community_report_list_empty")}</p>
      <p className="text-meta text-slate-400 max-w-md mx-auto">{t("community_report_list_empty_hint")}</p>
      <div className="flex flex-wrap justify-center gap-3 pt-1">
        <Link
          href="/community"
          className={`${TT_COMMUNITY_PAGE_L5.pill} motion-reduce:transition-none ${communityCyanPillFocus}`}
        >
          {t("community_tab_feed")}
        </Link>
        <Link
          href="/community/explore"
          className={`${TT_COMMUNITY_PAGE_L5.primaryCtaFilled} ${communityCyanPillFocus}`}
        >
          {t("community_explore_title")}
        </Link>
      </div>
    </div>
  );
}
