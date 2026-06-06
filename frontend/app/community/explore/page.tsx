"use client";

import { CommunityExplorePageMain } from "./CommunityExplorePageMain";
import { useCommunityExplorePage } from "./useCommunityExplorePage";

/** 31 §2.1：发现页——分区组件 + idle 延后社交查询 + 瀑布流 content-visibility */
export default function CommunityExplorePage() {
  const vm = useCommunityExplorePage();
  return <CommunityExplorePageMain vm={vm} />;
}
