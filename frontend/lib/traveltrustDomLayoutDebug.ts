/** `/traveltrust` DOM 叠层排查（① · `?tt_dom_outline=1`） */

export const TT_DOM_OUTLINE_QUERY = "tt_dom_outline";

export function shouldMountTraveltrustDomLayoutDebug(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get(TT_DOM_OUTLINE_QUERY) === "1";
}

/** 给非透明 background 的 section/main/div 描红边（与用户 Console 片段同逻辑） */
export function applyTraveltrustDomLayoutOutlineDebug(root: ParentNode = document): void {
  root.querySelectorAll("section,main,div").forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const bg = getComputedStyle(node).backgroundColor;
    if (bg === "rgba(0, 0, 0, 0)") return;
    node.style.outline = "2px solid red";
    node.dataset.ttDomOutlineBg = bg;
  });
}

export function clearTraveltrustDomLayoutOutlineDebug(root: ParentNode = document): void {
  root.querySelectorAll("[data-tt-dom-outline-bg]").forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    node.style.outline = "";
    delete node.dataset.ttDomOutlineBg;
  });
}
