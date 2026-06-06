"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { getMeLikesReceived } from "@/lib/apiClient/community";
import { communityMeLikesReceivedQueryKey } from "@/lib/communityMeLikesReceivedContract";
import OrderChatContextCard from "@/components/community/OrderChatContextCard";
import { CommunityInteractionSummary } from "@/components/community/CommunityInteractionSummary";
import {
  communityCyanPillFocus,
  communityFuchsiaPillFocus,
  communityFuchsiaTextFocus,
  communitySlatePillFocus,
} from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";
import {
  isCommunityMeLikesReceivedMetricUserHiddenOnDevice,
} from "@/lib/communityMeLikesMetricPrivacy";
import {
  CommunityRelationalShowcaseHonestyNote,
  communityRelationalShowcaseDataAttr,
} from "@/components/community/CommunityRelationalShowcaseHonestyNote";
import { CommunityMessagesConversationsSection } from "./CommunityMessagesConversationsSection";
import { useCommunityMessagesPage } from "./useCommunityMessagesPage";

/** 31 附录 / 51-31-6：潮流社区 · 消息（会话列表）；53-S7 支持 ?orderId= 来自订单详情「前往订单聊天」 */
export function CommunityMessagesPageMain() {
  const vm = useCommunityMessagesPage();
  const relationalShowcaseAttr = communityRelationalShowcaseDataAttr();

  return (
    <main
      className="max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-6 pb-24 safe-area-pb"
      aria-label={vm.t("community_tab_messages")}
      data-tt-community-messages-page="1"
      {...relationalShowcaseAttr}
      aria-describedby={
        relationalShowcaseAttr
          ? "community-relational-showcase-hint-community_messages_relational_showcase_hint"
          : undefined
      }
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className={TT_COMMUNITY_PAGE_L5.pageTitle}>
            {vm.t("community_tab_messages")}
          </h1>
          <p className="text-small text-slate-300 mt-0.5">{vm.t("community_messages_desc")}</p>
          <CommunityRelationalShowcaseHonestyNote
            t={vm.t}
            hintKey="community_messages_relational_showcase_hint"
          />
        </div>
        <Link
          href="/community/activity"
          className={`shrink-0 rounded-full border border-slate-500/60 bg-ink-800/70 px-3 py-2 text-meta text-slate-300 hover:border-ref-sun/30 hover:text-ref-sun/95 motion-sub min-h-[44px] inline-flex items-center justify-center ${communitySlatePillFocus}`}
        >
          {vm.t("community_activity_open_full")}
        </Link>
      </header>

      <div
        role="tablist"
        aria-label={vm.t("community_messages_tabs_aria")}
        className="flex flex-wrap gap-2 mb-4 border-b border-slate-600/40 pb-3"
      >
        <form
          className="inline"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            vm.setMessagesTab("dm");
          }}
        >
          <button
            type="submit"
            role="tab"
            aria-selected={vm.messagesTab === "dm"}
            className={`px-4 py-2 text-meta font-medium motion-sub ${communityCyanPillFocus} ${
              vm.messagesTab === "dm" ? TT_COMMUNITY_PAGE_L5.innerTabActive : TT_COMMUNITY_PAGE_L5.innerTabIdle
            }`}
          >
            {vm.t("community_messages_tab_dm")}
          </button>
        </form>
        <form
          className="inline"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            vm.setMessagesTab("activity");
          }}
        >
          <button
            type="submit"
            role="tab"
            aria-selected={vm.messagesTab === "activity"}
            onPointerEnter={() => {
              void queryClient.prefetchQuery({
                queryKey: communityMeLikesReceivedQueryKey,
                queryFn: getMeLikesReceived,
                staleTime: 60_000,
              });
            }}
            className={`px-4 py-2 text-meta font-medium motion-sub ${communityCyanPillFocus} ${
              vm.messagesTab === "activity" ? TT_COMMUNITY_PAGE_L5.innerTabActive : TT_COMMUNITY_PAGE_L5.innerTabIdle
            }`}
          >
            {vm.t("community_messages_tab_activity")}
          </button>
        </form>
      </div>

      {vm.messagesTab === "activity" ? (
        <div className="mb-6 space-y-4">
          <CommunityInteractionSummary
            t={vm.t}
            loginReturnPath="/community/messages?tab=activity"
            variant="messages"
            isLoggedIn={vm.isLoggedIn}
            authPending={vm.authPending}
            likesReceived={vm.likesReceived}
            likesLoading={vm.fetchLikesMetric && (vm.likesQ.isLoading || vm.likesQ.isFetching)}
            likesError={vm.fetchLikesMetric && (vm.likesQ.isError || vm.likesContractInvalid)}
            likesMetricDisabledByConfig={
              vm.isLoggedIn && !vm.authPending && vm.messagesTab === "activity" && !vm.likesListEnabled
            }
            likesMetricSuppressed={
              vm.isLoggedIn &&
              !vm.authPending &&
              vm.messagesTab === "activity" &&
              isCommunityMeLikesReceivedMetricUserHiddenOnDevice(vm.likesListEnabled, vm.hideLikesReceivedMetric)
            }
            likesErrorMessage={vm.likesErrorMessage}
            onRetryLikes={() => void vm.likesQ.refetch()}
          />
          <p className="text-center text-meta text-slate-400">
            <Link
              href="/community/activity"
              className={`inline-flex min-h-[44px] items-center justify-center text-ref-sun hover:text-ref-sun/95 hover:underline ${communityFuchsiaTextFocus}`}
            >
              {vm.t("community_activity_open_full")}
            </Link>
          </p>
        </div>
      ) : null}

      {vm.messagesTab === "dm" && vm.orderId ? <OrderChatContextCard orderId={vm.orderId} /> : null}

      {vm.messagesTab === "dm" && vm.sharePostId ? (
        <div
          className="mb-3 rounded-[var(--radius-md)] border border-ref-sun/30 bg-ref-sun/10 px-4 py-3 flex flex-wrap items-center justify-between gap-2"
          role="status"
          aria-live="polite"
        >
          <p className="text-small text-ref-sun/90">{vm.t("community_share_pick_conversation")}</p>
          <form
            className="inline shrink-0"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              if (typeof window === "undefined") return;
              const u = new URL(window.location.href);
              u.searchParams.delete("sharePostId");
              const qs = u.searchParams.toString();
              vm.router.replace(`${u.pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
            }}
          >
            <button
              type="submit"
              aria-label={vm.t("community_share_cancel")}
              className={`rounded-full border border-slate-500/60 bg-ink-800/70 px-3 py-1.5 text-meta text-slate-300 hover:bg-ink-700/60 motion-sub min-h-[44px] inline-flex items-center justify-center ${communitySlatePillFocus}`}
            >
              {vm.t("community_share_cancel")}
            </button>
          </form>
        </div>
      ) : null}

      {vm.messagesTab === "dm" && vm.pullY > 0 ? (
        <div
          className="md:hidden flex items-center justify-center text-meta text-ref-sun transition-opacity"
          style={{ height: Math.min(vm.pullY, 56) }}
          role="status"
          aria-live="polite"
          aria-label={vm.pullY > 50 ? vm.t("community_release_to_refresh") : vm.t("community_pull_to_refresh")}
        >
          {vm.pullY > 50 ? vm.t("community_release_to_refresh") : vm.t("community_pull_to_refresh")}
        </div>
      ) : null}

      {vm.messagesTab === "dm" ? (
        <CommunityMessagesConversationsSection
          t={vm.t}
          locale={vm.locale}
          dash={vm.dash}
          loading={vm.loading}
          listLoadError={vm.listLoadError}
          isEmpty={vm.isEmpty}
          displayList={vm.displayList}
          retryList={vm.retryList}
          sharePostId={vm.sharePostId}
          orderId={vm.orderId}
        />
      ) : null}

      <p className="text-meta text-slate-400 text-center mt-6">{vm.t("community_more_coming")}</p>
    </main>
  );
}
