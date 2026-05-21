/**
 * P3-A · Hero 装饰城市节点（DOM/SVG · 示意 · 非 WebGL · ①）
 * 不写入 traveltrustPhase1GlobeRegions（冻结清单）。
 */
import type { TraveltrustStartCorridorId } from "@/lib/traveltrustStartCorridorBinding";

export type HeroP3DecorNodeTier = "S" | "A" | "B";

export type HeroP3DecorNode = {
  id: string;
  /** 与 Phase1 枢纽对齐时用于 P1 focus 高亮 */
  phase1RegionId?: string;
  lat: number;
  lon: number;
  tier: HeroP3DecorNodeTier;
  corridorId: TraveltrustStartCorridorId;
  labelKey: string;
};

/** 24 示意枢纽 · 全球链上旅游网络密度（① · 非航班数据） */
export const TRAVELTRUST_HERO_P3_DECOR_NODES: readonly HeroP3DecorNode[] = [
  { id: "cn", phase1RegionId: "cn", lat: 31.2, lon: 121.5, tier: "S", corridorId: "asia", labelKey: "traveltrust_phase1_region_cn" },
  { id: "jp", phase1RegionId: "jp", lat: 35.68, lon: 139.69, tier: "A", corridorId: "asia", labelKey: "traveltrust_phase1_region_jp" },
  { id: "th", phase1RegionId: "th", lat: 13.75, lon: 100.5, tier: "A", corridorId: "asia", labelKey: "traveltrust_phase1_region_th" },
  { id: "sg", phase1RegionId: "sg", lat: 1.29, lon: 103.85, tier: "A", corridorId: "asia", labelKey: "traveltrust_phase1_region_sg" },
  { id: "kr", phase1RegionId: "kr", lat: 37.57, lon: 126.98, tier: "A", corridorId: "asia", labelKey: "traveltrust_phase1_region_kr" },
  { id: "in", lat: 19.08, lon: 72.88, tier: "A", corridorId: "asia", labelKey: "traveltrust_hero_p3_city_in" },
  { id: "vn", lat: 10.82, lon: 106.63, tier: "B", corridorId: "asia", labelKey: "traveltrust_hero_p3_city_vn" },
  { id: "us", phase1RegionId: "us", lat: 40.7, lon: -74, tier: "S", corridorId: "atlantic", labelKey: "traveltrust_phase1_region_us" },
  { id: "fr", phase1RegionId: "fr", lat: 48.86, lon: 2.35, tier: "S", corridorId: "atlantic", labelKey: "traveltrust_phase1_region_fr" },
  { id: "es", phase1RegionId: "es", lat: 40.4, lon: -3.7, tier: "S", corridorId: "atlantic", labelKey: "traveltrust_phase1_region_es" },
  { id: "gb", lat: 51.51, lon: -0.13, tier: "A", corridorId: "atlantic", labelKey: "traveltrust_hero_p3_city_gb" },
  { id: "de", lat: 52.52, lon: 13.41, tier: "A", corridorId: "atlantic", labelKey: "traveltrust_hero_p3_city_de" },
  { id: "it", lat: 41.9, lon: 12.5, tier: "B", corridorId: "atlantic", labelKey: "traveltrust_hero_p3_city_it" },
  { id: "br", lat: -23.55, lon: -46.63, tier: "B", corridorId: "atlantic", labelKey: "traveltrust_hero_p3_city_br" },
  { id: "au", phase1RegionId: "au", lat: -33.87, lon: 151.21, tier: "B", corridorId: "pacific", labelKey: "traveltrust_phase1_region_au" },
  { id: "nz", lat: -36.85, lon: 174.76, tier: "B", corridorId: "pacific", labelKey: "traveltrust_hero_p3_city_nz" },
  { id: "fj", lat: -18.14, lon: 178.44, tier: "B", corridorId: "pacific", labelKey: "traveltrust_hero_p3_city_fj" },
  { id: "ae", phase1RegionId: "ae", lat: 25.2, lon: 55.27, tier: "B", corridorId: "mena", labelKey: "traveltrust_phase1_region_ae" },
  { id: "eg", lat: 30.04, lon: 31.24, tier: "B", corridorId: "mena", labelKey: "traveltrust_hero_p3_city_eg" },
  { id: "tr", lat: 41.01, lon: 28.98, tier: "B", corridorId: "mena", labelKey: "traveltrust_hero_p3_city_tr" },
  { id: "za", lat: -26.2, lon: 28.04, tier: "B", corridorId: "mena", labelKey: "traveltrust_hero_p3_city_za" },
  { id: "mx", lat: 19.43, lon: -99.13, tier: "A", corridorId: "atlantic", labelKey: "traveltrust_hero_p3_city_mx" },
  { id: "ca", lat: 43.65, lon: -79.38, tier: "A", corridorId: "atlantic", labelKey: "traveltrust_hero_p3_city_ca" },
  { id: "id", lat: -6.21, lon: 106.85, tier: "A", corridorId: "asia", labelKey: "traveltrust_hero_p3_city_id" },
] as const;

export const TRAVELTRUST_HERO_P3_DECOR_NODE_COUNT = TRAVELTRUST_HERO_P3_DECOR_NODES.length;

/** P3 精修 · 首屏仅 6 个核心枢纽显示文字标签，其余 18 个仅光点 */
export const TRAVELTRUST_HERO_P3_CORE_LABEL_NODE_IDS = [
  "cn",
  "us",
  "fr",
  "jp",
  "sg",
  "ae",
] as const;

export type HeroP3CoreLabelNodeId = (typeof TRAVELTRUST_HERO_P3_CORE_LABEL_NODE_IDS)[number];

export function isHeroP3CoreLabelNode(nodeId: string): nodeId is HeroP3CoreLabelNodeId {
  return (TRAVELTRUST_HERO_P3_CORE_LABEL_NODE_IDS as readonly string[]).includes(nodeId);
}

export const TRAVELTRUST_HERO_P3_CORE_LABEL_COUNT = TRAVELTRUST_HERO_P3_CORE_LABEL_NODE_IDS.length;

export function resolveHeroP3DecorNodeFocusId(focusedRegionId: string | null): string | null {
  if (!focusedRegionId) return null;
  const hit = TRAVELTRUST_HERO_P3_DECOR_NODES.find(
    (n) => n.phase1RegionId === focusedRegionId || n.id === focusedRegionId,
  );
  return hit?.id ?? focusedRegionId;
}

export function isHeroP3DecorNodeHighlighted(
  node: HeroP3DecorNode,
  focusedRegionId: string | null,
  activeCorridorId: TraveltrustStartCorridorId,
): boolean {
  const focusId = resolveHeroP3DecorNodeFocusId(focusedRegionId);
  if (focusId && (node.id === focusId || node.phase1RegionId === focusId)) return true;
  if (!focusedRegionId && activeCorridorId !== "any" && node.corridorId === activeCorridorId) return true;
  return false;
}
