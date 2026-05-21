/**
 * P3 · Hero 地球表面 → 左栏 viewport 实时投影快照（① · 非冻结）
 * 由 Canvas 内 `TravelTrustHeroGlobeProjectionPublisher` 每帧写入。
 */

export type HeroGlobeBoundScreenPoint = {
  leftPct: number;
  topPct: number;
  /** 半球朝向相机 · 与 WebGL 针脚 cull 同源 */
  facingDot: number;
  /** 在 hero globe viewport 内且 NDC 深度有效 */
  visible: boolean;
  /** 0–1 · 边缘/地平线淡出 */
  edgeFade: number;
};

export type HeroGlobeProjectionSnapshot = {
  revision: number;
  /** globe-bound 有效（矩阵 + DOM 矩形齐全） */
  active: boolean;
  /** 示意球面半径 · 与 Phase1 针脚 surfaceR 对齐 */
  surfaceRadius: number;
  points: Readonly<Record<string, HeroGlobeBoundScreenPoint>>;
};

const EMPTY_POINTS: Readonly<Record<string, HeroGlobeBoundScreenPoint>> = {};

let snapshot: HeroGlobeProjectionSnapshot = {
  revision: 0,
  active: false,
  surfaceRadius: 1,
  points: EMPTY_POINTS,
};

const listeners = new Set<() => void>();

export function getHeroGlobeProjectionSnapshot(): HeroGlobeProjectionSnapshot {
  return snapshot;
}

export function setHeroGlobeProjectionSnapshot(next: HeroGlobeProjectionSnapshot): void {
  snapshot = next;
  listeners.forEach((l) => l());
}

export function subscribeHeroGlobeProjection(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetHeroGlobeProjectionSnapshot(): void {
  setHeroGlobeProjectionSnapshot({
    revision: snapshot.revision + 1,
    active: false,
    surfaceRadius: snapshot.surfaceRadius,
    points: EMPTY_POINTS,
  });
}
