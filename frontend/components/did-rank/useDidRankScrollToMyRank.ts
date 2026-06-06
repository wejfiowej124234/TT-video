import { useCallback } from "react";

import type { TravelerRankItem, GuideRankItem } from "@/lib/didRankTypes";

import { trackDidRankEvent } from "@/lib/analytics";

import { scrollToDidRankElement } from "@/lib/didRankScrollToElement";



export function useDidRankScrollToMyRank(options: {

  highlightTravelerId: string | null;

  highlightGuideId: string | null;

  listTravelers: TravelerRankItem[];

  listGuides: GuideRankItem[];

  travelerRankTopGridId: string;

  guideRankTopGridId: string;

  pageSize: number;

  setPageTraveler: (page: number) => void;

  setPageGuide: (page: number) => void;

  expandTravelerFold?: () => void;

  expandGuideFold?: () => void;

}) {

  const {

    highlightTravelerId,

    highlightGuideId,

    listTravelers,

    listGuides,

    travelerRankTopGridId,

    guideRankTopGridId,

    pageSize,

    setPageTraveler,

    setPageGuide,

    expandTravelerFold,

    expandGuideFold,

  } = options;



  const scrollToTravelerRank = useCallback(() => {

    if (!highlightTravelerId) return;

    trackDidRankEvent("did_rank_go_to_my_rank", { type: "traveler" });

    const idx = listTravelers.findIndex((x) => x.id === highlightTravelerId);

    if (idx >= 0) {

      if (idx < 10) {

        setPageTraveler(1);

        scrollToDidRankElement(`traveler-top10-${highlightTravelerId}`, {

          block: "center",

        });

      } else {

        expandTravelerFold?.();

        const page = Math.floor((idx - 10) / pageSize) + 1;

        setPageTraveler(page);

        scrollToDidRankElement(`traveler-row-${highlightTravelerId}`, { block: "center" });

      }

    }

  }, [

    highlightTravelerId,

    listTravelers,

    pageSize,

    setPageTraveler,

    expandTravelerFold,

  ]);



  const scrollToGuideRank = useCallback(() => {

    if (!highlightGuideId) return;

    trackDidRankEvent("did_rank_go_to_my_rank", { type: "guide" });

    const idx = listGuides.findIndex((x) => x.id === highlightGuideId);

    if (idx >= 0) {

      if (idx < 10) {

        setPageGuide(1);

        scrollToDidRankElement(`guide-top10-${highlightGuideId}`, { block: "center" });

      } else {

        expandGuideFold?.();

        const page = Math.floor((idx - 10) / pageSize) + 1;

        setPageGuide(page);

        scrollToDidRankElement(`guide-row-${highlightGuideId}`, { block: "center" });

      }

    }

  }, [highlightGuideId, listGuides, pageSize, setPageGuide, expandGuideFold]);



  return { scrollToTravelerRank, scrollToGuideRank };

}

