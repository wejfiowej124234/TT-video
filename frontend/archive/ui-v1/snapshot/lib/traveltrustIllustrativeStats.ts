/** 示意统计 SSOT（TT-PH1-180 · ①）— 数值非链上真值 */
export const TRAVELTRUST_ILLUSTRATIVE_STATS = [
  {
    id: "corridors",
    labelKey: "traveltrust_stat_corridors_label",
    valueKey: "traveltrust_stat_corridors_value",
    footnoteKey: "traveltrust_stat_corridors_footnote",
  },
  {
    id: "escrow_ready",
    labelKey: "traveltrust_stat_escrow_ready_label",
    valueKey: "traveltrust_stat_escrow_ready_value",
    footnoteKey: "traveltrust_stat_escrow_ready_footnote",
  },
  {
    id: "phase1_regions",
    labelKey: "traveltrust_stat_phase1_regions_label",
    valueKey: "traveltrust_stat_phase1_regions_value",
    footnoteKey: "traveltrust_stat_phase1_regions_footnote",
  },
] as const;

export type TraveltrustIllustrativeStatId = (typeof TRAVELTRUST_ILLUSTRATIVE_STATS)[number]["id"];
