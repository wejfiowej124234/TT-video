/**
 * P1 E2E 探针 · 焦点清空（非冻结 · ①）
 * 仅 `NEXT_PUBLIC_TRAVELTRUST_E2E_PROBE=1`；不触碰地球材质/贴图/坐标 SSOT。
 */
import { setHeroGlobeP1FocusedRegion } from "@/lib/traveltrustHeroGlobeP1Link";

let clearGlobeCanvasHoverForProbe: (() => void) | null = null;

/** 由 `TravelTrustGlobeInteractionProvider` 在探针模式下注册 */
export function registerGlobeCanvasHoverProbeClear(fn: (() => void) | null): void {
  clearGlobeCanvasHoverForProbe = fn;
}

/** 清空 P1 focus + Canvas 针脚 hover（探针 reset 用） */
export function clearHeroGlobeFocusForProbe(): void {
  setHeroGlobeP1FocusedRegion(null);
  clearGlobeCanvasHoverForProbe?.();
}
