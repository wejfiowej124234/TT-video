import { type FormEvent } from "react";
import Link from "next/link";
import { communityCardLinkFocus, communityCyanPillFocus, communityShellTabFocus } from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_FEED_ACTION, TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";

export type CommunityFeedListEmptyStateProps = {
  t: (key: string) => string;
  isEmptySearch: boolean;
  feedTab: "recommend" | "following";
  isLoggedIn: boolean;
  setSearchQuery: (v: string) => void;
  setFeedTab: (v: "recommend" | "following") => void;
  onPublishClick: (trigger?: HTMLElement | null) => void;
  onFollowingEmptyGuestLogin?: () => void;
};

/** @deprecated 空态已内联于 `CommunityFeedList.tsx`；保留本模块供拆线回归，样式须与 Feed §1.7 SSOT 同轨。 */
export function CommunityFeedListEmptyState({
  t,
  isEmptySearch,
  feedTab,
  isLoggedIn,
  setSearchQuery,
  setFeedTab,
  onPublishClick,
  onFollowingEmptyGuestLogin,
}: CommunityFeedListEmptyStateProps) {
  return (
    <section
      className={TT_COMMUNITY_FEED_ACTION.emptyPanel}
      aria-label={
        isEmptySearch
          ? t("community_search_placeholder")
          : feedTab === "following"
            ? !isLoggedIn
              ? t("community_following_empty_guest")
              : t("community_following_empty")
            : t("community_empty")
      }
    >
      <p className="text-body text-slate-300 mb-4">
        {isEmptySearch
          ? t("community_search_empty")
          : feedTab === "following"
            ? !isLoggedIn
              ? t("community_following_empty_guest")
              : t("community_following_empty")
            : t("community_empty")}
      </p>
      {isEmptySearch ? (
        <div className="flex flex-col items-center gap-4">
          <form
            className="inline"
            onSubmit={(e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              setSearchQuery("");
            }}
          >
            <button type="submit" className={`${TT_COMMUNITY_FEED_ACTION.retryPill} ${communityCardLinkFocus}`}>
              {t("community_search_clear")}
            </button>
          </form>
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-slate-400">
            <Link
              href="/community/explore"
              className={`inline-flex min-h-[44px] items-center justify-center rounded-sm px-0.5 ${TT_COMMUNITY_FEED_ACTION.secondaryLink} ${communityShellTabFocus}`}
            >
              {t("community_explore_title")}
            </Link>
            <span className="text-slate-500" aria-hidden>
              ·
            </span>
            <Link
              href="/help"
              className={`inline-flex min-h-[44px] items-center justify-center rounded-sm px-0.5 ${TT_COMMUNITY_FEED_ACTION.secondaryLink} ${communityShellTabFocus}`}
            >
              {t("help_title")}
            </Link>
          </p>
        </div>
      ) : feedTab === "following" ? (
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-wrap justify-center gap-3">
            {!isLoggedIn && typeof onFollowingEmptyGuestLogin === "function" ? (
              <form
                className="inline"
                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  onFollowingEmptyGuestLogin();
                }}
              >
                <button type="submit" className={`${TT_COMMUNITY_PAGE_L5.primaryCtaFilled} ${communityCyanPillFocus}`}>
                  {t("community_following_empty_guest_login")}
                </button>
              </form>
            ) : null}
            <form
              className="inline"
              onSubmit={(e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                setFeedTab("recommend");
              }}
            >
              <button type="submit" className={`${TT_COMMUNITY_FEED_ACTION.retryPill} ${communityCardLinkFocus}`}>
                {t("community_following_see_recommend")}
              </button>
            </form>
            {isLoggedIn ? (
              <Link href="/community/friends" className={`${TT_COMMUNITY_PAGE_L5.pill} ${communityCyanPillFocus}`}>
                {t("community_following_follow_more")}
              </Link>
            ) : null}
          </div>
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-slate-400">
            <Link
              href="/community/explore"
              className={`inline-flex min-h-[44px] items-center justify-center rounded-sm px-0.5 ${TT_COMMUNITY_FEED_ACTION.secondaryLink} ${communityShellTabFocus}`}
            >
              {t("community_explore_title")}
            </Link>
            <span className="text-slate-500" aria-hidden>
              ·
            </span>
            <Link
              href="/help"
              className={`inline-flex min-h-[44px] items-center justify-center rounded-sm px-0.5 ${TT_COMMUNITY_FEED_ACTION.secondaryLink} ${communityShellTabFocus}`}
            >
              {t("help_title")}
            </Link>
            <span className="text-slate-500" aria-hidden>
              ·
            </span>
            <Link
              href="/terms/community-guidelines"
              className={`inline-flex min-h-[44px] items-center justify-center rounded-sm px-0.5 ${TT_COMMUNITY_FEED_ACTION.secondaryLink} ${communityShellTabFocus}`}
            >
              {t("community_guidelines")}
            </Link>
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <form
            className="inline"
            onSubmit={(e) => {
              e.preventDefault();
              const sub = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
              onPublishClick(sub);
            }}
          >
            <button type="submit" className={`${TT_COMMUNITY_PAGE_L5.primaryCtaFilled} ${communityCyanPillFocus}`}>
              {t("community_empty_cta")}
            </button>
          </form>
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-slate-400">
            <Link
              href="/community/explore"
              className={`inline-flex min-h-[44px] items-center justify-center rounded-sm px-0.5 ${TT_COMMUNITY_FEED_ACTION.secondaryLink} ${communityShellTabFocus}`}
            >
              {t("community_explore_title")}
            </Link>
            <span className="text-slate-500" aria-hidden>
              ·
            </span>
            <Link
              href="/help"
              className={`inline-flex min-h-[44px] items-center justify-center rounded-sm px-0.5 ${TT_COMMUNITY_FEED_ACTION.secondaryLink} ${communityShellTabFocus}`}
            >
              {t("help_title")}
            </Link>
            <span className="text-slate-500" aria-hidden>
              ·
            </span>
            <Link
              href="/terms/community-guidelines"
              className={`inline-flex min-h-[44px] items-center justify-center rounded-sm px-0.5 ${TT_COMMUNITY_FEED_ACTION.secondaryLink} ${communityShellTabFocus}`}
            >
              {t("community_guidelines")}
            </Link>
          </p>
        </div>
      )}
    </section>
  );
}
