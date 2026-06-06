import { redirect } from "next/navigation";
import { isCommunityMeLikesListEnabled } from "@/lib/communityMeFeatureFlags";
import { CommunityMeLikesPageClient } from "./CommunityMeLikesPageClient";

/** 赞过独立页；功能关时回社区资料（与旧书签行为一致）。 */
export default function CommunityMeLikesPage() {
  if (!isCommunityMeLikesListEnabled()) {
    redirect("/community/me");
  }
  return <CommunityMeLikesPageClient />;
}
