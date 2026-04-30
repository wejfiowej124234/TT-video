import { redirect } from "next/navigation";
import { isCommunityMeLikesListEnabled } from "@/lib/communityMeFeatureFlags";

/**
 * 赞过已并入 `/community/me` 弹层，旧链接重定向以免书签 404。
 * 与 `NEXT_PUBLIC_COMMUNITY_ME_LIKES_LIST` 对齐：关列表时不带 `?tab=likes`（避免落地页再 strip 的二次导航与横幅闪烁）。
 */
export default function CommunityMeLikesLegacyRedirectPage() {
  if (isCommunityMeLikesListEnabled()) {
    redirect("/community/me?tab=likes");
  }
  redirect("/community/me");
}
