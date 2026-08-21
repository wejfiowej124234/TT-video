/**
 * `[data-tt-traveltrust-hero-sky-wash-l5]` 叠层诊断（①）
 * `?tt_sky_wash_debug=1` — 打印 className / computed / 父链
 * `?tt_sky_wash_z_probe=1` — 临时 `zIndex:9999` 验证（见 TravelTrustHeroFixedInkMask）
 */

export const TT_SKY_WASH_DEBUG_QUERY = "tt_sky_wash_debug";
export const TT_SKY_WASH_Z_PROBE_QUERY = "tt_sky_wash_z_probe";

const STACK_KEYS = [
  "position",
  "zIndex",
  "transform",
  "isolation",
  "opacity",
  "filter",
  "mixBlendMode",
  "willChange",
  "contain",
] as const;

export function shouldTraveltrustSkyWashDebug(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get(TT_SKY_WASH_DEBUG_QUERY) === "1";
}

export function shouldTraveltrustSkyWashZProbe(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get(TT_SKY_WASH_Z_PROBE_QUERY) === "1";
}

export type SkyWashParentStackRow = {
  depth: number;
  selector: string;
  stack: Record<(typeof STACK_KEYS)[number], string>;
};

export function collectSkyWashParentStack(el: HTMLElement): SkyWashParentStackRow[] {
  const rows: SkyWashParentStackRow[] = [];
  let node: HTMLElement | null = el;
  let depth = 0;
  while (node) {
    const cs = getComputedStyle(node);
    const stack = {} as Record<(typeof STACK_KEYS)[number], string>;
    for (const key of STACK_KEYS) stack[key] = cs[key as keyof CSSStyleDeclaration] as string;
    rows.push({
      depth,
      selector: node.id
        ? `${node.tagName.toLowerCase()}#${node.id}`
        : `${node.tagName.toLowerCase()}${node.className ? `.${String(node.className).trim().split(/\s+/).slice(0, 4).join(".")}` : ""}`,
      stack,
    });
    node = node.parentElement;
    depth += 1;
  }
  return rows;
}

export function dumpTraveltrustSkyWashNode(el: HTMLElement): void {
  const cs = getComputedStyle(el);
  const matchedRules: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) {
        if (!(rule instanceof CSSStyleRule)) continue;
        if (!el.matches(rule.selectorText)) continue;
        if (rule.style.zIndex) matchedRules.push(`${rule.selectorText} → z-index:${rule.style.zIndex}`);
      }
    } catch {
      /* cross-origin */
    }
  }
  console.group("[TT sky-wash debug] node");
  console.log("className:", el.className);
  console.log("dataset:", { ...el.dataset });
  console.log("computed z-index:", cs.zIndex, "| position:", cs.position);
  console.log("computed background-image:", cs.backgroundImage.slice(0, 120));
  console.log("matched CSS rules (z-index only):", matchedRules.length ? matchedRules : "(none with z-index)");
  console.table(collectSkyWashParentStack(el));
  console.groupEnd();
}
