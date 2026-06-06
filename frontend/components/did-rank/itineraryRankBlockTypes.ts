import type { ItineraryRankItem } from "@/lib/didRankTypes";
import type { Period } from "@/lib/didRankUtils";

export type ItineraryRankTFunc = (key: string) => string;

export interface ItineraryRankBlockProps {
  listItineraries: ItineraryRankItem[];
  period: Period;
  t: ItineraryRankTFunc;
}
