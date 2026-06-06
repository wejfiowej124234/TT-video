"use client";

import { type FormEvent } from "react";
import Link from "next/link";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { communityCyanPillFocus } from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";
import { useCommunityFriendsPageModel } from "./useCommunityFriendsPageModel";
import { CommunityFriendsMainTabs } from "./CommunityFriendsMainTabs";
import { CommunityFriendsRequestsPanel } from "./CommunityFriendsRequestsPanel";
import { CommunityFriendsRelationsPanel } from "./CommunityFriendsRelationsPanel";

/** 31 附录 / 51-31-7：潮流社区 · 关注/粉丝/好友 + 好友申请；数据仅来自 API */
export function CommunityFriendsPageInner() {
  const m = useCommunityFriendsPageModel();

  return (
    <main
      className="max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-6 pb-24 safe-area-pb text-slate-200"
      aria-label={m.t("community_tab_friends")}
      data-tt-community-friends-page="1"
    >
      <header className="mb-4">
        <h1 className={TT_COMMUNITY_PAGE_L5.pageTitle}>
          {m.t("community_tab_friends")}
        </h1>
        <p className="text-small text-slate-300 mt-0.5">{m.t("community_friends_desc")}</p>
      </header>

      {!m.authLoading && !m.isLoggedIn ? (
        <section
          className="rounded-[var(--radius-md)] border border-ref-sun/28 bg-ink-900/70 backdrop-blur-md px-6 py-10 text-center space-y-4 mb-4"
          role="region"
          aria-label={m.t("community_tab_friends")}
        >
          <p className="text-body text-slate-200">{m.t("community_friends_login_hint")}</p>
          <Link
            href={`/auth/login?returnUrl=${encodeURIComponent("/community/friends")}`}
            className={`${TT_COMMUNITY_PAGE_L5.pill} ${communityCyanPillFocus}`}
          >
            {m.t("community_activity_go_login")}
          </Link>
        </section>
      ) : null}

      {m.loadError != null && !m.loading && m.isLoggedIn ? (
        <section
          className="rounded-[var(--radius-md)] border border-warning/50 bg-warning/10 px-6 py-10 text-center space-y-3 mb-4"
          role="alert"
          aria-live="polite"
        >
          <ApiErrorAlert message={m.loadError} tone="dark" />
          <form
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              m.retryLoad();
            }}
          >
            <button
              type="submit"
              aria-label={m.t("common_retry")}
              className={`${TT_COMMUNITY_PAGE_L5.pill} ${communityCyanPillFocus}`}
            >
              {m.t("common_retry")}
            </button>
          </form>
        </section>
      ) : null}

      {(m.loadError == null || m.loading) && m.isLoggedIn && (
        <>
          <CommunityFriendsMainTabs tabRows={m.tabRows} tab={m.tab} t={m.t} selectTab={m.selectTab} />

          {m.tab === "requests" ? (
            <CommunityFriendsRequestsPanel
              loading={m.loading}
              requestSubTab={m.requestSubTab}
              setRequestSubTab={m.setRequestSubTab}
              apiRequestsSent={m.apiRequestsSent}
              apiRequestsReceived={m.apiRequestsReceived}
              t={m.t}
              setApiRequestsReceived={m.setApiRequestsReceived}
              showFriendsActionError={m.showFriendsActionError}
              showFriendsToast={m.showFriendsToast}
            />
          ) : (
            <CommunityFriendsRelationsPanel
              tab={m.tab}
              currentKeyLabel={m.currentKeyLabel}
              loading={m.loading}
              followingList={m.followingList}
              t={m.t}
              msgHref={m.msgHref}
              unfollowPendingId={m.unfollowPendingId}
              addRequestPendingId={m.addRequestPendingId}
              addRequestSent={m.addRequestSent}
              handleUnfollow={m.handleUnfollow}
              handleAddFriendRequest={m.handleAddFriendRequest}
            />
          )}
        </>
      )}

      <p className="text-meta text-slate-400 text-center mt-6">{m.t("community_more_coming")}</p>

      {m.friendsToastText && (
        <div
          className="fixed left-1/2 z-[120] bottom-24 md:bottom-8 -translate-x-1/2 max-w-[min(100vw-2rem,24rem)] rounded-[var(--radius-md)] border border-warning/50 bg-ink-900/95 backdrop-blur px-4 py-3 text-small text-warning/95 shadow-medium safe-area-pb"
          role="status"
          aria-live="polite"
        >
          {m.friendsToastText}
        </div>
      )}
    </main>
  );
}
