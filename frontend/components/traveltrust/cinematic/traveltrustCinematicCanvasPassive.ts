import type { CSSProperties } from "react";
import * as THREE from "three";
import { TT_CINEMATIC_3D_BG } from "./traveltrustCinematic3dConfig";

/** 电影页背景 Canvas：不抢滚轮/触摸，事件穿透到下方正文（`pointer-events` 不继承到子元素） */
export const TRAVELTRUST_CINEMATIC_CANVAS_STYLE: CSSProperties = {
  width: "100%",
  height: "100%",
  background: "transparent",
  pointerEvents: "none",
};

type TravelTrustCinematicGl = {
  domElement: HTMLCanvasElement;
  setClearColor: (color: THREE.ColorRepresentation, alpha?: number) => void;
  setClearAlpha?: (alpha: number) => void;
};

/** 固定暖墨清除色（passive + interactive 共用；避免 `alpha:true` 时 clearAlpha=0 透出冷色空域） */
export function applyTravelTrustPageCinematicClear(gl: TravelTrustCinematicGl): void {
  gl.setClearColor(new THREE.Color(TT_CINEMATIC_3D_BG), 1);
  gl.setClearAlpha?.(1);
  gl.domElement.style.backgroundColor = TT_CINEMATIC_3D_BG;
}

/** 统一入口：清除色 + 指针穿透（`/traveltrust` 全页 Canvas） */
export function applyTravelTrustPageCinematicGl(
  gl: TravelTrustCinematicGl,
  options: { interactive: boolean },
): void {
  applyTravelTrustPageCinematicClear(gl);
  gl.domElement.style.pointerEvents = options.interactive ? "auto" : "none";
  gl.domElement.style.cursor = options.interactive ? "default" : "";
}

export function applyTravelTrustPassiveCanvasGl(gl: TravelTrustCinematicGl): void {
  applyTravelTrustPageCinematicGl(gl, { interactive: false });
}

/** L5 · pin hover/click on Hero globe (Canvas TT_Z.CANVAS; copy column TT_Z.HERO_COPY). */
export function applyTravelTrustInteractiveCanvasGl(gl: TravelTrustCinematicGl): void {
  applyTravelTrustPageCinematicGl(gl, { interactive: true });
}


export function buildTraveltrustCinematicCanvasStyle(interactive: boolean): CSSProperties {

  return {

    ...TRAVELTRUST_CINEMATIC_CANVAS_STYLE,

    pointerEvents: interactive ? "auto" : "none",

  };

}

