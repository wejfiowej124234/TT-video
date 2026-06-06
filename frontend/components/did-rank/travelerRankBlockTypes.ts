import type { RefObject } from "react";
import type { TravelerRankItem } from "@/lib/didRankTypes";
import type { Period } from "@/lib/didRankUtils";

export type TravelerRankTFunc = (key: string) => string;

export interface TravelerRankBlockProps {
  listRef: RefObject<HTMLDivElement | null>;
  listTravelers: TravelerRankItem[];
  topTravelers: TravelerRankItem[];
  listTravelersFrom11: TravelerRankItem[];
  paginatedTravelers: TravelerRankItem[];
  totalPagesTraveler: number;
  pageTraveler: number;
  setPageTraveler: (fn: (p: number) => number) => void;
  highlightTravelerId: string | null;
  scrollToTravelerRank: () => void;
  onOpenRecord: (item: TravelerRankItem) => void;
  failedAvatarIds: Set<string>;
  addFailedAvatar: (id: string) => void;
  t: TravelerRankTFunc;
  rankTopGridId: string;
  period: Period;
}
