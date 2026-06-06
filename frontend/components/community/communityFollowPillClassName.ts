import { communityCyanPillFocus, communitySlatePillFocus } from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_DRAWER_L5 } from "@/lib/marketingUi";

export type CommunityFollowPillSize = "compact" | "default";

/** 社区「关注 / 已关注」pill · 抽屉 / 侧栏 / 帖卡同源 */
export function communityFollowPillClassName(opts: {
  followed: boolean;
  disabled?: boolean;
  size?: CommunityFollowPillSize;
}): string {
  const size =
    opts.size === "compact"
      ? "min-h-[36px] px-2.5 py-1 text-[0.68rem]"
      : "min-h-[44px] px-4 py-1.5 text-meta";
  const state = opts.followed
    ? `${TT_COMMUNITY_DRAWER_L5.followPillFollowing} ${communitySlatePillFocus}`
    : `${TT_COMMUNITY_DRAWER_L5.followPillIdle} ${communityCyanPillFocus}`;
  const disabled = opts.disabled ? " opacity-60 cursor-wait" : "";
  return `shrink-0 rounded-full border font-semibold motion-sub inline-flex items-center justify-center ${size} ${state}${disabled}`;
}
