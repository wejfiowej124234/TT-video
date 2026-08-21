/**
 * P3-A · Hero 装饰城市节点（DOM/SVG · 示意 · 非 WebGL · ①）
 * 坐标 SSOT：`traveltrustHubGeo.ts` · `resolveHeroP3HubLatLon`
 */
import type { TraveltrustStartCorridorId } from "@/lib/traveltrustStartCorridorBinding";
import { resolveTraveltrustHubLatLonById } from "@/lib/traveltrustHubGeo";

export type HeroP3DecorNodeTier = "S" | "A" | "B";

export type HeroP3DecorNode = {
  id: string;
  /** 与 Phase1 枢纽对齐时用于 P1 focus 高亮 */
  phase1RegionId?: string;
  tier: HeroP3DecorNodeTier;
  corridorId: TraveltrustStartCorridorId;
  labelKey: string;
};

/** P3 装饰节点元数据（无内嵌 lat/lon） */
const P3_DECOR_NODE_META: HeroP3DecorNode[] = [
  { id: "cn", phase1RegionId: "cn", tier: "S", corridorId: "asia", labelKey: "traveltrust_phase1_region_cn" },
  { id: "jp", phase1RegionId: "jp", tier: "A", corridorId: "asia", labelKey: "traveltrust_phase1_region_jp" },
  { id: "th", phase1RegionId: "th", tier: "A", corridorId: "asia", labelKey: "traveltrust_phase1_region_th" },
  { id: "sg", phase1RegionId: "sg", tier: "A", corridorId: "asia", labelKey: "traveltrust_phase1_region_sg" },
  { id: "kr", phase1RegionId: "kr", tier: "A", corridorId: "asia", labelKey: "traveltrust_phase1_region_kr" },
  { id: "in", tier: "A", corridorId: "asia", labelKey: "traveltrust_hero_p3_city_in" },
  { id: "vn", tier: "B", corridorId: "asia", labelKey: "traveltrust_hero_p3_city_vn" },
  { id: "us", phase1RegionId: "us", tier: "S", corridorId: "atlantic", labelKey: "traveltrust_phase1_region_us" },
  { id: "fr", phase1RegionId: "fr", tier: "S", corridorId: "atlantic", labelKey: "traveltrust_phase1_region_fr" },
  { id: "es", phase1RegionId: "es", tier: "S", corridorId: "atlantic", labelKey: "traveltrust_phase1_region_es" },
  { id: "gb", tier: "A", corridorId: "atlantic", labelKey: "traveltrust_hero_p3_city_gb" },
  { id: "de", tier: "A", corridorId: "atlantic", labelKey: "traveltrust_hero_p3_city_de" },
  { id: "it", tier: "B", corridorId: "atlantic", labelKey: "traveltrust_hero_p3_city_it" },
  { id: "br", tier: "B", corridorId: "atlantic", labelKey: "traveltrust_hero_p3_city_br" },
  { id: "au", phase1RegionId: "au", tier: "B", corridorId: "pacific", labelKey: "traveltrust_phase1_region_au" },
  { id: "nz", tier: "B", corridorId: "pacific", labelKey: "traveltrust_hero_p3_city_nz" },
  { id: "fj", tier: "B", corridorId: "pacific", labelKey: "traveltrust_hero_p3_city_fj" },
  { id: "ae", phase1RegionId: "ae", tier: "B", corridorId: "mena", labelKey: "traveltrust_phase1_region_ae" },
  { id: "eg", tier: "B", corridorId: "mena", labelKey: "traveltrust_hero_p3_city_eg" },
  { id: "tr", tier: "B", corridorId: "mena", labelKey: "traveltrust_hero_p3_city_tr" },
  { id: "za", tier: "B", corridorId: "mena", labelKey: "traveltrust_hero_p3_city_za" },
  { id: "mx", tier: "A", corridorId: "atlantic", labelKey: "traveltrust_hero_p3_city_mx" },
  { id: "ca", tier: "A", corridorId: "atlantic", labelKey: "traveltrust_hero_p3_city_ca" },
  { id: "id", tier: "A", corridorId: "asia", labelKey: "traveltrust_hero_p3_city_id" },
];

export const TRAVELTRUST_HERO_P3_DECOR_NODES: readonly HeroP3DecorNode[] = P3_DECOR_NODE_META;

export const TRAVELTRUST_HERO_P3_DECOR_NODE_COUNT = TRAVELTRUST_HERO_P3_DECOR_NODES.length;

/**
 * Phase1 · 十国首屏国名+城市标签（顺序与 `TRAVELTRUST_PHASE1_GLOBE_REGIONS` 一致）
 * 其余 P3 装饰城仅光点
 */
export const TRAVELTRUST_HERO_P3_CORE_LABEL_NODE_IDS = [
  "cn",
  "us",
  "fr",
  "es",
  "jp",
  "th",
  "sg",
  "kr",
  "au",
  "ae",
] as const;

export const TRAVELTRUST_HERO_P3_PHASE1_LABEL_COUNT = TRAVELTRUST_HERO_P3_CORE_LABEL_NODE_IDS.length;

export type HeroP3CoreLabelNodeId = (typeof TRAVELTRUST_HERO_P3_CORE_LABEL_NODE_IDS)[number];

export function isHeroP3CoreLabelNode(nodeId: string): nodeId is HeroP3CoreLabelNodeId {
  return (TRAVELTRUST_HERO_P3_CORE_LABEL_NODE_IDS as readonly string[]).includes(nodeId);
}

export const TRAVELTRUST_HERO_P3_CORE_LABEL_COUNT = TRAVELTRUST_HERO_P3_CORE_LABEL_NODE_IDS.length;

/** P3 / 光点 / 标签 · 与 Phase1 针脚同源 hub 坐标 */
export function resolveHeroP3HubLatLon(node: Pick<HeroP3DecorNode, "id" | "phase1RegionId">): {
  lat: number;
  lon: number;
} {
  const hubId = node.phase1RegionId ?? node.id;
  return resolveTraveltrustHubLatLonById(hubId);
}

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
