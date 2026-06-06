"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resolveCommunityMeHubRedirect } from "@/lib/communityMeHubRedirect";
import { CommunityParamRouteSuspense } from "@/components/community/CommunityParamRouteSuspense";

/** `/community/me` Hub 已取消：保留 `?tab=` 深链；裸路径 → `/me/settings/profile`。 */
function CommunityMeHubRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    router.replace(resolveCommunityMeHubRedirect(searchParams));
  }, [router, searchParams]);

  return null;
}

export default function CommunityMePage() {
  return (
    <CommunityParamRouteSuspense mainAriaLabelKey="me_title" horizontalPadding="px-3">
      <Suspense fallback={null}>
        <CommunityMeHubRedirectInner />
      </Suspense>
    </CommunityParamRouteSuspense>
  );
}
