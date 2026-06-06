import type { CSSProperties } from "react";

/** 电影页背景 Canvas：不抢滚轮/触摸，事件穿透到下方正文（`pointer-events` 不继承到子元素） */
export const TRAVELTRUST_CINEMATIC_CANVAS_STYLE: CSSProperties = {
  width: "100%",
  height: "100%",
  background: "transparent",
  pointerEvents: "none",
};

export function applyTravelTrustPassiveCanvasGl(
  gl: { domElement: HTMLCanvasElement },
): void {
  gl.domElement.style.pointerEvents = "none";
}
