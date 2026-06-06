import { useMemo } from "react";
import type { TravelerRankItem, GuideRankItem } from "@/lib/didRankTypes";
import { getPaginatedSlice, getTotalPages } from "@/lib/didRankUtils";

export function useDidRankBoardPagination(
  listTravelers: TravelerRankItem[],
  listGuides: GuideRankItem[],
  pageTraveler: number,
  pageGuide: number,
  pageSize: number,
) {
  return useMemo(() => {
    const topTravelers = listTravelers.slice(0, 10);
    const topGuides = listGuides.slice(0, 10);
    const listTravelersFrom11 = listTravelers.slice(10);
    const listGuidesFrom11 = listGuides.slice(10);
    const totalPagesTraveler = getTotalPages(listTravelersFrom11.length, pageSize);
    const totalPagesGuide = getTotalPages(listGuidesFrom11.length, pageSize);
    const paginatedTravelers = getPaginatedSlice(listTravelersFrom11, pageTraveler, pageSize);
    const paginatedGuides = getPaginatedSlice(listGuidesFrom11, pageGuide, pageSize);
    return {
      topTravelers,
      topGuides,
      listTravelersFrom11,
      listGuidesFrom11,
      totalPagesTraveler,
      totalPagesGuide,
      paginatedTravelers,
      paginatedGuides,
    };
  }, [listTravelers, listGuides, pageTraveler, pageGuide, pageSize]);
}
