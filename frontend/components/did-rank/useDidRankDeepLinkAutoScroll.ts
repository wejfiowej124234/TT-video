"use client";

import { useEffect, useRef } from "react";
import type { GuideRankItem, ItineraryRankItem, TravelerRankItem } from "@/lib/didRankTypes";
import { trackDidRankEvent } from "@/lib/analytics";
import type { DidRankBoardTab, Period } from "@/lib/didRankUtils";
import { parseDidRankMeHighlight } from "@/lib/didRankUtils";

/** `?me=traveler-*` / `?me=guide-*` / `?me=itinerary-*` / 副榜 首次数据就绪后自动切榜 */
export function useDidRankDeepLinkAutoScroll(options: {
  meParam: string;
  period: Period;
  isLoading: boolean;
  isRefreshing: boolean;
  activeBoard: DidRankBoardTab;
  setBoard: (next: DidRankBoardTab) => void;
  highlightTravelerId: string | null;
  highlightGuideId: string | null;
  listTravelers: TravelerRankItem[];
  listGuides: GuideRankItem[];
  scrollToTravelerRank: () => void;
  scrollToGuideRank: () => void;
  itineraryLoading?: boolean;
  listItineraries?: ItineraryRankItem[];
  scrollToItineraryRank?: () => void;
}) {
  const {
    meParam,
    period,
    isLoading,
    isRefreshing,
    activeBoard,
    setBoard,
    highlightTravelerId,
    highlightGuideId,
    listTravelers,
    listGuides,
    scrollToTravelerRank,
    scrollToGuideRank,
    itineraryLoading = false,
    listItineraries = [],
    scrollToItineraryRank,
  } = options;

  const doneKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const me = meParam.trim();
    if (!me || isLoading || isRefreshing) return;

    const parsed = parseDidRankMeHighlight(me);
    if (!parsed) return;

    if (parsed.board === "provider" || parsed.board === "acquisition") {
      if (activeBoard !== parsed.board) {
        setBoard(parsed.board);
      }
      return;
    }

    if (parsed.board === "itinerary") {
      if (activeBoard !== "itinerary") {
        setBoard("itinerary");
        return;
      }
      const scrollKey = `${me}:${period}:itinerary`;
      if (doneKeyRef.current === scrollKey) return;
      if (itineraryLoading || listItineraries.length === 0 || !scrollToItineraryRank) return;
      const idx = listItineraries.findIndex((x) => x.id === parsed.userId);
      if (idx < 0) return;
      doneKeyRef.current = scrollKey;
      trackDidRankEvent("did_rank_deeplink_auto_scroll", { board: "itinerary", rankIndex: idx });
      window.setTimeout(() => scrollToItineraryRank(), 280);
      return;
    }

    const targetBoard: DidRankBoardTab =
      parsed.board === "guide" ? "guide" : "traveler";
    if (activeBoard !== targetBoard) {
      setBoard(targetBoard);
      return;
    }

    const scrollKey = `${me}:${period}:${targetBoard}`;
    if (doneKeyRef.current === scrollKey) return;

    if (parsed.board === "traveler") {
      if (!highlightTravelerId || listTravelers.length === 0) return;
      const idx = listTravelers.findIndex((x) => x.id === highlightTravelerId);
      if (idx < 0) return;
      doneKeyRef.current = scrollKey;
      trackDidRankEvent("did_rank_deeplink_auto_scroll", { board: "traveler", rankIndex: idx });
      const delay = idx >= 10 ? 420 : 240;
      window.setTimeout(() => scrollToTravelerRank(), delay);
      return;
    }

    if (!highlightGuideId || listGuides.length === 0) return;
    const idx = listGuides.findIndex((x) => x.id === highlightGuideId);
    if (idx < 0) return;
    doneKeyRef.current = scrollKey;
    trackDidRankEvent("did_rank_deeplink_auto_scroll", { board: "guide", rankIndex: idx });
    const delay = idx >= 10 ? 420 : 240;
    window.setTimeout(() => scrollToGuideRank(), delay);
  }, [
    meParam,
    period,
    isLoading,
    isRefreshing,
    activeBoard,
    setBoard,
    highlightTravelerId,
    highlightGuideId,
    listTravelers,
    listGuides,
    scrollToTravelerRank,
    scrollToGuideRank,
    itineraryLoading,
    listItineraries,
    scrollToItineraryRank,
  ]);
}
