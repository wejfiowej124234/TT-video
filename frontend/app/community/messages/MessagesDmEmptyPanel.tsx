import { TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";
import Link from "next/link";
import { communityCyanPillFocus } from "@/lib/communityA11yFocus";

/** 88 §3.2：私信 Tab 空会话列表 — 与好友页申请空态同口径（虚线框 + 说明 + CTA） */
export function MessagesDmEmptyPanel({ t }: { t: (k: string) => string }) {
  return (
    <div
      className={`mx-3 sm:mx-4 my-4 ${TT_COMMUNITY_PAGE_L5.emptyDashed}`}
      role="region"
      aria-label={t("community_messages_empty")}
    >
      <div className={TT_COMMUNITY_PAGE_L5.emptyIcon} aria-hidden>
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337L5.05 21l1.395-3.72C5.512 15.042 5 13.574 5 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
          />
        </svg>
      </div>
      <p className="text-body text-slate-200">{t("community_messages_empty")}</p>
      <p className="text-meta text-slate-400 max-w-md mx-auto">{t("community_messages_empty_hint")}</p>
      <div className="flex flex-wrap justify-center gap-3 pt-1">
        <Link
          href="/community"
          className={`${TT_COMMUNITY_PAGE_L5.pill} ${communityCyanPillFocus}`}
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
