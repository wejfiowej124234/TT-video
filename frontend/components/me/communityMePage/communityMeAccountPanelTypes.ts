import type { CommunitySocialStatsPayload, DataState } from "@/lib/dataState";
import type { CommunityMeAccountPanelTFunc } from "./communityMeAccountPanelUtils";

export type CommunityMeAccountPanelProps = {
  t: CommunityMeAccountPanelTFunc;
  enabled: boolean;
  socialStatsState: DataState<CommunitySocialStatsPayload>;
  onSocialStatsRetry?: () => void;
  /** 社区「我的」：压缩资料卡与统计区高度 */
  compactVertical?: boolean;
  /** `NEXT_PUBLIC_COMMUNITY_ME_LIKES_LIST` 且未启用本机隐藏获赞数 */
  showLikesReceivedMetric?: boolean;
  hideLikesReceivedMetric?: boolean;
  /** 设置子页等场景：隐藏 FAB 快捷抽屉（顶栏/设置 Hub 已覆盖入口） */
  hideQuickLinks?: boolean;
};
