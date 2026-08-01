import type { TravelerRankItem, GuideRankItem, ItineraryRankItem } from "@/lib/didRankTypes";
import type { GuideLeaderboardSort, Period } from "@/lib/didRankUtils";

/** `/did-rank` 首屏 SSR 快照（默认 period=all · guideSort=weighted · ① 本地） */
export type DidRankPageInitialSnapshot = {
  period: Period;
  guideSort: GuideLeaderboardSort;
  travelers: TravelerRankItem[];
  guides: GuideRankItem[];
  /** Product Truth：行程榜城市（含北京）须进 SSR，避免仅 travelers 昵称偶然命中 */
  itineraries: ItineraryRankItem[];
  devPreviewActive: boolean;
  prizePool: {
    amount: number;
    illustrative: boolean;
    apiConnected: boolean;
    note: string | null;
    source?: string;
  } | null;
};
