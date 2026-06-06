"use client";

import { CommunityParamRouteSuspense } from "@/components/community/CommunityParamRouteSuspense";
import { CommunityUserPageClient } from "./CommunityUserPageClient";

export default function CommunityUserPage() {
  return (
    <CommunityParamRouteSuspense mainAriaLabelKey="community_user_main_aria" horizontalPadding="px-4">
      <CommunityUserPageClient />
    </CommunityParamRouteSuspense>
  );
}
