/** DID 排行榜 · 脊签列主题（30 §4.2：游客 cyan / 向导 fuchsia / 商家 amber / 收购 emerald） */

export type DidRankListColumn = "traveler" | "guide" | "itinerary" | "provider" | "acquisition";

export type DidRankColumnTheme = {
  metric: string;
  metricMuted: string;
  top10StageTint: string;
  listPanelRing: string;
  listRowHoverInset: string;
  listRowHighlightRing: string;
  deltaUp: string;
  deltaDown: string;
};

const TRAVELER: DidRankColumnTheme = {
  metric: "text-ref-sun",
  metricMuted: "text-ref-sun/85",
  top10StageTint: "from-ref-sun/[0.07]",
  listPanelRing: "ring-ref-sun/10",
  listRowHoverInset: "hover:shadow-[inset_3px_0_0_0_rgba(252,164,124,0.35)]",
  listRowHighlightRing: "ring-ref-sun/45",
  deltaUp: "bg-ref-sun/15 text-ref-sun",
  deltaDown: "bg-ref-coral/12 text-ref-coral/95",
};

const GUIDE: DidRankColumnTheme = {
  metric: "text-fuchsia-300",
  metricMuted: "text-fuchsia-300/90",
  top10StageTint: "from-fuchsia-500/[0.07]",
  listPanelRing: "ring-fuchsia-500/14",
  listRowHoverInset: "hover:shadow-[inset_3px_0_0_0_rgba(217,70,239,0.38)]",
  listRowHighlightRing: "ring-fuchsia-400/45",
  deltaUp: "bg-fuchsia-500/15 text-fuchsia-300",
  deltaDown: "bg-fuchsia-950/40 text-fuchsia-200/80",
};

const PROVIDER: DidRankColumnTheme = {
  metric: "text-amber-300",
  metricMuted: "text-amber-300/90",
  top10StageTint: "from-amber-500/[0.06]",
  listPanelRing: "ring-amber-500/12",
  listRowHoverInset: "hover:shadow-[inset_3px_0_0_0_rgba(245,158,11,0.32)]",
  listRowHighlightRing: "ring-amber-400/40",
  deltaUp: "bg-amber-500/15 text-amber-300",
  deltaDown: "bg-amber-950/30 text-amber-200/85",
};

const ITINERARY: DidRankColumnTheme = {
  metric: "text-amber-300",
  metricMuted: "text-amber-300/90",
  top10StageTint: "from-amber-500/[0.06]",
  listPanelRing: "ring-amber-500/12",
  listRowHoverInset: "hover:shadow-[inset_3px_0_0_0_rgba(245,158,11,0.32)]",
  listRowHighlightRing: "ring-amber-400/40",
  deltaUp: "bg-amber-500/15 text-amber-300",
  deltaDown: "bg-amber-950/30 text-amber-200/85",
};

const ACQUISITION: DidRankColumnTheme = {
  metric: "text-emerald-300",
  metricMuted: "text-emerald-300/90",
  top10StageTint: "from-emerald-500/[0.06]",
  listPanelRing: "ring-emerald-500/12",
  listRowHoverInset: "hover:shadow-[inset_3px_0_0_0_rgba(16,185,129,0.32)]",
  listRowHighlightRing: "ring-emerald-400/40",
  deltaUp: "bg-emerald-500/15 text-emerald-300",
  deltaDown: "bg-emerald-950/30 text-emerald-200/85",
};

export function didRankColumnTheme(column: DidRankListColumn): DidRankColumnTheme {
  switch (column) {
    case "guide":
      return GUIDE;
    case "provider":
      return PROVIDER;
    case "acquisition":
      return ACQUISITION;
    case "itinerary":
      return ITINERARY;
    default:
      return TRAVELER;
  }
}
