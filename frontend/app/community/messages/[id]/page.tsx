"use client";

import { CommunityParamRouteSuspense } from "@/components/community/CommunityParamRouteSuspense";
import { CommunityConversationPageMain } from "./CommunityConversationPageMain";
import { useCommunityConversationPage } from "./useCommunityConversationPage";

function CommunityConversationPageInner() {
  const vm = useCommunityConversationPage();
  return <CommunityConversationPageMain {...vm} />;
}

export default function CommunityConversationPage() {
  return (
    <CommunityParamRouteSuspense
      mainAriaLabelKey="community_conversation_thread_aria"
      horizontalPadding="px-4"
    >
      <CommunityConversationPageInner />
    </CommunityParamRouteSuspense>
  );
}
