import { TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";
import Link from "next/link";
import { communityCyanPillFocus } from "@/lib/communityA11yFocus";

/** 88 §3.2：好友申请子 Tab 空态 — 虚线框 + 说明 + Feed/发现 CTA（与探索页结构化空态同口径） */
export function FriendsRequestsEmptyPanel({
  variant,
  t,
}: {
  variant: "sent" | "received";
  t: (k: string) => string;
}) {
  return (
    <div
      className="rounded-[var(--radius-md)] border border-dashed border-ref-sun/30 bg-ink-900/45 px-5 py-10 text-center space-y-4"
      role="region"
      aria-label={variant === "sent" ? t("community_requests_sent_empty") : t("community_requests_empty")}
    >
      <div
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-ref-sun/28 bg-ref-sun/10 text-ref-sun"
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.48-3.987M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
          />
        </svg>
      </div>
      <p className="text-body text-slate-200">
        {variant === "sent" ? t("community_requests_sent_empty") : t("community_requests_empty")}
      </p>
      <p className="text-meta text-slate-400 max-w-md mx-auto">
        {variant === "sent"
          ? t("community_friends_requests_empty_hint_sent")
          : t("community_friends_requests_empty_hint_received")}
      </p>
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
