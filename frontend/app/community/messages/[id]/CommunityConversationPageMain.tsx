"use client";

import Link from "next/link";
import { communityCyanPillFocus } from "@/lib/communityA11yFocus";
import { CommunityConversationPageComposer } from "./CommunityConversationPageComposer";
import { CommunityConversationPageHeader } from "./CommunityConversationPageHeader";
import { CommunityConversationPageThreadPanel } from "./CommunityConversationPageThreadPanel";
import type { CommunityConversationPageViewModel } from "./useCommunityConversationPage";
import { TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";

export function CommunityConversationPageMain(vm: CommunityConversationPageViewModel) {
  const { t, id, messagesListHref } = vm;

  if (!id) {
    return (
      <main
        className="max-w-4xl mx-auto px-4 py-8 text-center pb-24 safe-area-pb"
        aria-label={t("community_conversation_not_found")}
        data-tt-community-messages-thread-page="1"
      >
        <h1 className="sr-only">{t("community_conversation_not_found")}</h1>
        <p className="text-slate-300">{t("community_conversation_not_found")}</p>
        <Link
          href={messagesListHref}
          className={`mt-4 ${TT_COMMUNITY_PAGE_L5.pill} ${communityCyanPillFocus}`}
        >
          {t("community_back_to_list")}
        </Link>
      </main>
    );
  }

  return (
    <main
      className="max-w-4xl mx-auto flex flex-col min-h-0 h-[calc(100vh-8rem)]"
      aria-label={t("community_conversation_thread_aria")}
      data-tt-community-messages-thread-page="1"
    >
      <CommunityConversationPageHeader
        t={vm.t}
        messagesListHref={vm.messagesListHref}
        profileHref={vm.profileHref}
        displayPeer={vm.displayPeer}
        peerAvatarUrl={vm.peerAvatarUrl}
        peerRole={vm.peerRole}
        peerIsEscrowGuide={vm.peerIsEscrowGuide}
        peerUserId={vm.peerUserId}
      />
      <CommunityConversationPageThreadPanel
        t={vm.t}
        orderThreadContextId={vm.orderThreadContextId}
        loading={vm.loading}
        threadLoadError={vm.threadLoadError}
        retryThread={vm.retryThread}
        messages={vm.messages}
        myId={vm.myId}
      />
      <CommunityConversationPageComposer
        t={vm.t}
        showcaseReadonly={vm.showcaseReadonly}
        dmBodyFieldError={vm.dmBodyFieldError}
        setDmBodyFieldError={vm.setDmBodyFieldError}
        dmBodyErrorNoticeId={vm.dmBodyErrorNoticeId}
        sendIssue={vm.sendIssue}
        setSendIssue={vm.setSendIssue}
        dmSendErrorNoticeId={vm.dmSendErrorNoticeId}
        handleSend={vm.handleSend}
        isLoggedIn={vm.isLoggedIn}
        sending={vm.sending}
        inputValue={vm.inputValue}
        setInputValue={vm.setInputValue}
      />
    </main>
  );
}
