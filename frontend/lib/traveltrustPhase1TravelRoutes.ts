/** Decorative hub routes for globe arcs (① · illustrative mesh · not flight data). */
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
  { id: "cn-sg", fromId: "cn", toId: "sg", tier: "A" },
  { id: "kr-cn", fromId: "kr", toId: "cn", tier: "A" },
  { id: "kr-th", fromId: "kr", toId: "th", tier: "A" },
  { id: "jp-th", fromId: "jp", toId: "th", tier: "A" },
  { id: "au-jp", fromId: "au", toId: "jp", tier: "A" },
  { id: "th-ae", fromId: "th", toId: "ae", tier: "A" },
  { id: "kr-jp", fromId: "kr", toId: "jp", tier: "A" },
  { id: "kr-sg", fromId: "kr", toId: "sg", tier: "A" },
  { id: "th-sg", fromId: "th", toId: "sg", tier: "A" },
  { id: "us-fr", fromId: "us", toId: "fr", tier: "S" },
  { id: "us-es", fromId: "us", toId: "es", tier: "A" },
  { id: "fr-es", fromId: "fr", toId: "es", tier: "A" },
  { id: "jp-sg", fromId: "jp", toId: "sg", tier: "A" },
  { id: "sg-au", fromId: "sg", toId: "au", tier: "A" },
  { id: "sg-ae", fromId: "sg", toId: "ae", tier: "A" },
  { id: "fr-ae", fromId: "fr", toId: "ae", tier: "A" },
  { id: "es-us", fromId: "es", toId: "us", tier: "A" },
];

const ROUTE_BY_ID = Object.fromEntries(TRAVELTRUST_PHASE1_TRAVEL_ROUTES.map((r) => [r.id, r])) as Record<
  string,
  TravelTrustPhase1TravelRoute
>;

function pickRoutes(ids: string[]): TravelTrustPhase1TravelRoute[] {
  return ids.map((id) => ROUTE_BY_ID[id]).filter(Boolean);
}

/** Mobile / low-quality: fewer arcs for performance. */
export const TRAVELTRUST_PHASE1_TRAVEL_ROUTES_LITE: TravelTrustPhase1TravelRoute[] = pickRoutes([
  "us-fr",
  "us-es",
  "cn-th",
  "jp-sg",
  "sg-ae",
]);
