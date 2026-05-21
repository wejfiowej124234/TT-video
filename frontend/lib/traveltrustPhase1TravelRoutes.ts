/** Decorative hub routes for globe arcs (① · illustrative, not flight data). */
export type TravelTrustPhase1TravelRoute = {
  id: string;
  fromId: string;
  toId: string;
  /** S = flagship corridor */
  tier: "S" | "A";
};

export const TRAVELTRUST_PHASE1_TRAVEL_ROUTES: TravelTrustPhase1TravelRoute[] = [
  { id: "cn-fr", fromId: "cn", toId: "fr", tier: "S" },
  { id: "cn-th", fromId: "cn", toId: "th", tier: "S" },
  { id: "cn-jp", fromId: "cn", toId: "jp", tier: "A" },
  { id: "us-fr", fromId: "us", toId: "fr", tier: "S" },
  { id: "us-es", fromId: "us", toId: "es", tier: "A" },
  { id: "fr-es", fromId: "fr", toId: "es", tier: "A" },
  { id: "jp-sg", fromId: "jp", toId: "sg", tier: "A" },
  { id: "sg-au", fromId: "sg", toId: "au", tier: "A" },
  { id: "fr-ae", fromId: "fr", toId: "ae", tier: "A" },
  { id: "es-us", fromId: "es", toId: "us", tier: "A" },
];

/** Mobile / low-quality: fewer arcs for performance. */
/** Lite: transatlantic corridors only (runtime bias may narrow further). */
export const TRAVELTRUST_PHASE1_TRAVEL_ROUTES_LITE: TravelTrustPhase1TravelRoute[] = [
  TRAVELTRUST_PHASE1_TRAVEL_ROUTES[3],
  TRAVELTRUST_PHASE1_TRAVEL_ROUTES[4],
  TRAVELTRUST_PHASE1_TRAVEL_ROUTES[5],
  TRAVELTRUST_PHASE1_TRAVEL_ROUTES[9],
];
