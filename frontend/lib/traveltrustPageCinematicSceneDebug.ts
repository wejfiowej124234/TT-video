/**
 * `/traveltrust` 单 Canvas 场景层剥离调试（① · `?tt_scene_debug=1`）
 * 用法：Console `__ttSceneLayerDebug.setStep(1)` … `setStep(5)` 逐步隐藏并截图对比。
 */

import type { Scene, Object3D, Material, Color } from "three";
import * as THREE from "three";

export const TT_SCENE_DEBUG_QUERY = "tt_scene_debug";
export const TT_SCENE_STEP_QUERY = "tt_scene_step";

/**  cumulative hide order（与 maintainer 清单一致） */
export const TT_SCENE_DEBUG_HIDE_ORDER = [
  "warmSkyShell",
  "fog",
  "atmosphere",
  "arcs",
  "ocean",
] as const;

export type TtSceneDebugLayer = (typeof TT_SCENE_DEBUG_HIDE_ORDER)[number];

export const TT_SCENE_DEBUG_LAYER_LABELS: Record<TtSceneDebugLayer, string> = {
  warmSkyShell: "PageCinematicWarmSkyShell (BackSide sphere r=42)",
  fog: "scene.fog + scene.background",
  atmosphere: "PageCinematicEnvironment (Stars + DepthDust + HorizonFog plane)",
  arcs: "TravelTrustPhase1TravelArcs + GlobeHighlights",
  ocean: "TravelTrustTourismGlobe (earth mesh · frozen)",
};

export function shouldMountTraveltrustSceneLayerDebug(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get(TT_SCENE_DEBUG_QUERY) === "1";
}

export function readTraveltrustSceneDebugStep(): number {
  if (typeof window === "undefined") return 0;
  const raw = new URLSearchParams(window.location.search).get(TT_SCENE_STEP_QUERY);
  const n = raw == null ? 0 : Number.parseInt(raw, 10);
  return Number.isFinite(n) ? Math.max(0, Math.min(TT_SCENE_DEBUG_HIDE_ORDER.length, n)) : 0;
}

export function hiddenLayersForStep(step: number): Set<TtSceneDebugLayer> {
  const n = Math.max(0, Math.min(TT_SCENE_DEBUG_HIDE_ORDER.length, step));
  return new Set(TT_SCENE_DEBUG_HIDE_ORDER.slice(0, n));
}

function materialSummary(mat: Material | Material[]): Record<string, unknown> {
  const m = Array.isArray(mat) ? mat[0] : mat;
  if (!m) return { type: "none" };
  const row: Record<string, unknown> = { type: m.type, name: m.name || null };
  const colorProp = (m as { color?: Color }).color;
  if (colorProp?.isColor) row.color = `#${colorProp.getHexString()}`;
  if ("opacity" in m) row.opacity = (m as { opacity: number }).opacity;
  if ("transparent" in m) row.transparent = (m as { transparent: boolean }).transparent;
  if ("side" in m) row.side = (m as { side: number }).side;
  return row;
}

function geometrySummary(obj: THREE.Mesh | THREE.Line | THREE.Points): Record<string, unknown> {
  const g = obj.geometry;
  return {
    type: g?.type ?? "none",
    uuid: g?.uuid?.slice(0, 8),
    params: (g as { parameters?: Record<string, unknown> })?.parameters ?? null,
  };
}

export type SceneGraphRow = {
  layer: string | null;
  name: string;
  type: string;
  visible: boolean;
  renderOrder: number;
  position: [number, number, number];
  scale: [number, number, number];
  geometry: Record<string, unknown>;
  material: Record<string, unknown>;
  userData: Record<string, unknown>;
};

function resolveInheritedDebugLayer(obj: Object3D): string | null {
  let n: Object3D | null = obj;
  while (n) {
    const layer = n.userData?.ttSceneDebugLayer as string | undefined;
    if (layer) return layer;
    n = n.parent;
  }
  return null;
}

export function collectPageCinematicSceneGraph(scene: Scene): SceneGraphRow[] {
  const rows: SceneGraphRow[] = [];
  scene.traverse((obj) => {
    const layer = resolveInheritedDebugLayer(obj);
    const isMesh = (obj as THREE.Mesh).isMesh;
    const isLine = (obj as THREE.Line).isLine;
    const isPoints = (obj as THREE.Points).isPoints;
    if (!isMesh && !isLine && !isPoints && !layer) return;

    const meshLike = obj as THREE.Mesh | THREE.Line | THREE.Points;
    rows.push({
      layer,
      name: obj.name || obj.type,
      type: obj.type,
      visible: obj.visible,
      renderOrder: obj.renderOrder,
      position: obj.position.toArray() as [number, number, number],
      scale: obj.scale.toArray() as [number, number, number],
      geometry: isMesh || isLine || isPoints ? geometrySummary(meshLike) : {},
      material:
        isMesh || isLine || isPoints
          ? materialSummary(meshLike.material as Material | Material[])
          : { type: "n/a" },
      userData: { ...obj.userData },
    });
  });
  return rows;
}

export function dumpPageCinematicSceneGraph(scene: Scene): SceneGraphRow[] {
  const rows = collectPageCinematicSceneGraph(scene);
  const fog = scene.fog;
  const bg = scene.background;
  console.group("[TT scene debug] scene graph");
  console.table(rows);
  console.log("[TT scene debug] scene.fog:", fog);
  console.log("[TT scene debug] scene.background:", bg);
  console.log("[TT scene debug] children top-level:", scene.children.map((c) => c.type));
  console.groupEnd();
  return rows;
}

type FogBackup = { fog: Scene["fog"]; background: Scene["background"] };

const fogBackup: { current: FogBackup | null } = { current: null };

export function applyPageCinematicLayerVisibility(scene: Scene, step: number): void {
  const hidden = hiddenLayersForStep(step);

  if (!fogBackup.current) {
    fogBackup.current = { fog: scene.fog, background: scene.background };
  }

  const hideFogLayer = hidden.has("fog");
  scene.fog = hideFogLayer ? null : fogBackup.current.fog;
  scene.background = hideFogLayer ? null : fogBackup.current.background;

  scene.traverse((obj) => {
    const layer = obj.userData?.ttSceneDebugLayer as TtSceneDebugLayer | undefined;
    if (!layer) return;
    obj.visible = !hidden.has(layer);
  });
}

export function installPageCinematicSceneDebugApi(scene: Scene): void {
  if (typeof window === "undefined") return;
  const api = {
    steps: TT_SCENE_DEBUG_HIDE_ORDER,
    labels: TT_SCENE_DEBUG_LAYER_LABELS,
    step: readTraveltrustSceneDebugStep(),
    setStep(step: number) {
      const n = Math.max(0, Math.min(TT_SCENE_DEBUG_HIDE_ORDER.length, Math.floor(step)));
      applyPageCinematicLayerVisibility(scene, n);
      api.step = n;
      console.log(
        `[TT scene debug] step=${n} hidden:`,
        [...hiddenLayersForStep(n)],
        n === 0 ? "(baseline · 全显示)" : `下一层建议: ${TT_SCENE_DEBUG_HIDE_ORDER[n] ?? "done"}`,
      );
      dumpPageCinematicSceneGraph(scene);
      return n;
    },
    dump: () => dumpPageCinematicSceneGraph(scene),
    hideLayer: (layer: TtSceneDebugLayer) => {
      scene.traverse((obj) => {
        if (obj.userData?.ttSceneDebugLayer === layer) obj.visible = false;
      });
      if (layer === "fog") {
        if (!fogBackup.current) fogBackup.current = { fog: scene.fog, background: scene.background };
        scene.fog = null;
        scene.background = null;
      }
    },
    showAll: () => api.setStep(0),
  };
  (window as unknown as { __ttSceneLayerDebug?: typeof api }).__ttSceneLayerDebug = api;
}
