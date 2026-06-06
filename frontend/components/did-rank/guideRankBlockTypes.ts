import type { RefObject } from "react";
import type { GuideRankItem } from "@/lib/didRankTypes";
import type { Period } from "@/lib/didRankUtils";

export type GuideRankTFunc = (key: string) => string;

export interface GuideRankBlockProps {
  listRef: RefObject<HTMLDivElement | null>;
  listGuides: GuideRankItem[];
  topGuides: GuideRankItem[];
  listGuidesFrom11: GuideRankItem[];
  paginatedGuides: GuideRankItem[];
  totalPagesGuide: number;
  pageGuide: number;
  setPageGuide: (fn: (p: number) => number) => void;
  highlightGuideId: string | null;
  scrollToGuideRank: () => void;
  onOpenGuide: (item: GuideRankItem) => void;
  failedAvatarIds: Set<string>;
  addFailedAvatar: (id: string) => void;
  t: GuideRankTFunc;
  /** 前 10 网格锚点，供「跳到我的排名」滚动；由页面 `useId()` 传入 */
  rankTopGridId: string;
  period: Period;
}
