import type { DidRankBoardTab } from "@/lib/didRankUtils";

const warmed = new Set<DidRankBoardTab>();

/** ① · Tab hover 预载对应榜组件 chunk（配合 DidRankPageInner dynamic import） */
export function warmDidRankBoardChunk(board: DidRankBoardTab): void {
  if (warmed.has(board) || typeof window === "undefined") return;
  warmed.add(board);
  switch (board) {
    case "traveler":
      void import("@/components/did-rank/TravelerRankBlock");
      break;
    case "guide":
      void import("@/components/did-rank/GuideRankBlock");
      break;
    case "itinerary":
      void import("@/components/did-rank/ItineraryRankBlock");
      break;
    case "provider":
      void import("@/components/did-rank/ProviderRankBlock");
      break;
    case "acquisition":
      void import("@/components/did-rank/AcquisitionRankBlock");
      break;
  }
}
