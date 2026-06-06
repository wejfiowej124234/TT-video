"use client";

import { CommunityParamRouteSuspense } from "@/components/community/CommunityParamRouteSuspense";
import { CommunityMessagesPageMain } from "./CommunityMessagesPageMain";

/** 31 附录 / 51-31-6：消息列表入口（数据见 `useCommunityMessagesPage`） */
export default function CommunityMessagesPage() {
  return (
    <CommunityParamRouteSuspense mainAriaLabelKey="community_tab_messages">
      <CommunityMessagesPageMain />
    </CommunityParamRouteSuspense>
  );
}
