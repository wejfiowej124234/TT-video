/** WebGL 上下文丢失监听（TT-PH1-175 · ①） */
export function bindTravelTrustWebGLContextHandlers(
  canvas: HTMLCanvasElement,
  onLost: () => void,
): () => void {
  const onLostEv = (e: Event) => {
    e.preventDefault();
    onLost();
  };
  canvas.addEventListener("webglcontextlost", onLostEv, false);
  return () => canvas.removeEventListener("webglcontextlost", onLostEv);
}
