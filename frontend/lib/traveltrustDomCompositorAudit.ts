/**
 * `/traveltrust` DOM 合成阶段审计（① · `?tt_dom_compositor_audit=1`）
 * WebGL 输出之后的 mix-blend / backdrop / mask / fixed 叠层。
 */

export const TT_DOM_COMPOSITOR_AUDIT_QUERY = "tt_dom_compositor_audit";

/** 蓝块常见采样区（视口比例） */
export const TT_DOM_COMPOSITOR_PROBE_POINTS = [
  { id: "center-upper", x: 0.5, y: 0.22, label: "上区正中（蓝块核心）" },
  { id: "left-upper", x: 0.28, y: 0.3, label: "上区偏左" },
  { id: "center-mid", x: 0.5, y: 0.45, label: "中线（蓝块下缘）" },
  { id: "right-upper", x: 0.72, y: 0.26, label: "上区偏右（文案侧）" },
] as const;

export type TtDomCompositorProbePoint = (typeof TT_DOM_COMPOSITOR_PROBE_POINTS)[number];

const COMPOSITOR_STYLE_KEYS = [
  "mixBlendMode",
  "backdropFilter",
  "filter",
  "opacity",
  "transform",
  "isolation",
  "willChange",
  "maskImage",
  "webkitMaskImage",
  "background",
  "backgroundColor",
  "backgroundImage",
  "position",
  "zIndex",
  "top",
  "left",
  "right",
  "bottom",
  "width",
  "height",
  "contain",
  "pointerEvents",
  "display",
  "visibility",
] as const;

export type CompositorComputedSlice = Record<(typeof COMPOSITOR_STYLE_KEYS)[number], string> & {
  rect: { x: number; y: number; w: number; h: number };
};

export type CompositorHitEntry = {
  depth: number;
  selector: string;
  tag: string;
  id: string | null;
  className: string | null;
  dataset: Record<string, string>;
  computed: CompositorComputedSlice;
  pseudo?: { before?: CompositorComputedSlice | null; after?: CompositorComputedSlice | null };
  flags: string[];
};

export type CompositorProbeResult = {
  point: TtDomCompositorProbePoint & { px: number; py: number };
  hits: CompositorHitEntry[];
};

export type FixedZIndexNode = {
  selector: string;
  zIndex: number;
  tag: string;
  id: string | null;
  dataset: Record<string, string>;
  rect: { x: number; y: number; w: number; h: number };
  computed: CompositorComputedSlice;
  flags: string[];
};

export type CompositorSuspect = {
  selector: string;
  reason: string[];
  computed: Partial<CompositorComputedSlice>;
};

export type CinematicLayerNode = FixedZIndexNode & { position: string };

export type DomCompositorAuditReport = {
  url: string;
  viewport: { w: number; h: number };
  probes: CompositorProbeResult[];
  fixedZIndexPositive: FixedZIndexNode[];
  /** `[data-tt-traveltrust-page-cinematic-3d]` 内带合成信号的节点（含 absolute sky-cap/overlay） */
  cinematicLayerCompositor: CinematicLayerNode[];
  suspects: CompositorSuspect[];
};

export function shouldMountTraveltrustDomCompositorAudit(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get(TT_DOM_COMPOSITOR_AUDIT_QUERY) === "1";
}

function pickDataset(el: HTMLElement): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(el.dataset)) {
    if (k.startsWith("tt") || k.startsWith("ttTraveltrust")) out[k] = String(v);
  }
  return out;
}

function shortClass(className: string): string {
  const parts = className.split(/\s+/).filter(Boolean);
  if (parts.length <= 4) return parts.join(".");
  return `${parts.slice(0, 3).join(".")}…(+${parts.length - 3})`;
}

export function describeDomElement(el: Element): string {
  if (!(el instanceof HTMLElement)) return el.nodeName.toLowerCase();
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : "";
  const cls = el.className && typeof el.className === "string" ? `.${shortClass(el.className)}` : "";
  const dt = pickDataset(el);
  const dataHint = Object.keys(dt)
    .slice(0, 3)
    .map((k) => `[data-${k}=${dt[k]}]`)
    .join("");
  return `${tag}${id}${cls}${dataHint}`;
}

function pseudoHasBox(cs: CSSStyleDeclaration): boolean {
  const content = cs.content;
  return content !== "none" && content !== "normal" && content !== '""';
}

function sliceCompositorStyle(el: Element, pseudo?: string): CompositorComputedSlice | null {
  const cs = getComputedStyle(el, pseudo);
  if (pseudo && !pseudoHasBox(cs)) return null;

  const rect =
    el instanceof HTMLElement && !pseudo
      ? (() => {
          const r = el.getBoundingClientRect();
          return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
        })()
      : { x: 0, y: 0, w: 0, h: 0 };

  const row = {} as CompositorComputedSlice;
  for (const key of COMPOSITOR_STYLE_KEYS) {
    row[key] = cs[key as keyof CSSStyleDeclaration] as string;
  }
  row.rect = rect;
  return row;
}

export function compositorFlags(cs: CompositorComputedSlice): string[] {
  const flags: string[] = [];
  if (cs.mixBlendMode !== "normal") flags.push(`mix-blend:${cs.mixBlendMode}`);
  if (cs.backdropFilter !== "none") flags.push(`backdrop-filter:${cs.backdropFilter}`);
  if (cs.filter !== "none") flags.push(`filter:${cs.filter}`);
  if (parseFloat(cs.opacity) < 0.999) flags.push(`opacity:${cs.opacity}`);
  if (cs.transform !== "none") flags.push(`transform:${cs.transform}`);
  if (cs.isolation !== "auto") flags.push(`isolation:${cs.isolation}`);
  if (cs.willChange !== "auto") flags.push(`will-change:${cs.willChange}`);
  if (cs.maskImage !== "none" || cs.webkitMaskImage !== "none") flags.push("mask-image");
  if (cs.backgroundImage.includes("gradient") || cs.background.includes("gradient")) {
    flags.push("radial/linear-gradient");
  }
  if (cs.position === "fixed") flags.push(`fixed:z=${cs.zIndex}`);
  return flags;
}

function buildHitEntry(el: Element, depth: number): CompositorHitEntry {
  const computed = sliceCompositorStyle(el)!;
  const pseudoBefore = sliceCompositorStyle(el, "::before");
  const pseudoAfter = sliceCompositorStyle(el, "::after");
  return {
    depth,
    selector: describeDomElement(el),
    tag: el instanceof HTMLElement ? el.tagName.toLowerCase() : el.nodeName.toLowerCase(),
    id: el instanceof HTMLElement ? el.id || null : null,
    className: el instanceof HTMLElement && typeof el.className === "string" ? el.className : null,
    dataset: el instanceof HTMLElement ? pickDataset(el) : {},
    computed,
    pseudo: {
      before: pseudoBefore,
      after: pseudoAfter,
    },
    flags: compositorFlags(computed),
  };
}

export function probeElementsFromPoint(
  x: number,
  y: number,
  point?: Partial<TtDomCompositorProbePoint>,
): CompositorProbeResult {
  const chain = document.elementsFromPoint(x, y);
  const hits = chain.map((el, depth) => buildHitEntry(el, depth));
  const base = point ?? { id: "custom", x: x / window.innerWidth, y: y / window.innerHeight, label: "custom" };
  return {
    point: { ...base, px: Math.round(x), py: Math.round(y) } as CompositorProbeResult["point"],
    hits,
  };
}

export function collectFixedZIndexPositive(root: ParentNode = document): FixedZIndexNode[] {
  const rows: FixedZIndexNode[] = [];
  root.querySelectorAll("*").forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const cs = getComputedStyle(node);
    if (cs.position !== "fixed") return;
    const z = Number.parseInt(cs.zIndex, 10);
    if (!Number.isFinite(z) || z <= 0) return;
    const computed = sliceCompositorStyle(node)!;
    rows.push({
      selector: describeDomElement(node),
      zIndex: z,
      tag: node.tagName.toLowerCase(),
      id: node.id || null,
      dataset: pickDataset(node),
      rect: computed.rect,
      computed,
      flags: compositorFlags(computed),
    });
  });
  return rows.sort((a, b) => b.zIndex - a.zIndex || a.selector.localeCompare(b.selector));
}

export function collectPageCinematicCompositorNodes(): CinematicLayerNode[] {
  const root = document.querySelector('[data-tt-traveltrust-page-cinematic-3d="1"]');
  if (!root) return [];
  const rows: CinematicLayerNode[] = [];
  root.querySelectorAll("*").forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const computed = sliceCompositorStyle(node)!;
    const flags = compositorFlags(computed);
    if (flags.length === 0) return;
    const z = Number.parseInt(computed.zIndex, 10);
    rows.push({
      selector: describeDomElement(node),
      zIndex: Number.isFinite(z) ? z : 0,
      tag: node.tagName.toLowerCase(),
      id: node.id || null,
      dataset: pickDataset(node),
      rect: computed.rect,
      computed,
      flags,
      position: computed.position,
    });
  });
  return rows.sort((a, b) => b.zIndex - a.zIndex);
}

export function collectCompositorSuspects(root: ParentNode = document): CompositorSuspect[] {
  const suspects: CompositorSuspect[] = [];
  root.querySelectorAll("*").forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const cs = sliceCompositorStyle(node)!;
    const flags = compositorFlags(cs);
    if (flags.length === 0) {
      const before = sliceCompositorStyle(node, "::before");
      const after = sliceCompositorStyle(node, "::after");
      const pf: string[] = [];
      if (before) pf.push(...compositorFlags(before));
      if (after) pf.push(...compositorFlags(after));
      if (pf.length === 0) return;
      suspects.push({
        selector: describeDomElement(node),
        reason: pf.map((f) => `pseudo:${f}`),
        computed: { mixBlendMode: before?.mixBlendMode ?? after?.mixBlendMode },
      });
      return;
    }
    suspects.push({ selector: describeDomElement(node), reason: flags, computed: cs });
  });
  return suspects;
}

export function runTraveltrustDomCompositorAudit(
  root: ParentNode = document.querySelector('[data-tt-traveltrust-network-page="1"]') ?? document,
): DomCompositorAuditReport {
  const probes = TT_DOM_COMPOSITOR_PROBE_POINTS.map((pt) => {
    const x = Math.floor(window.innerWidth * pt.x);
    const y = Math.floor(window.innerHeight * pt.y);
    return probeElementsFromPoint(x, y, pt);
  });

  const fixedZIndexPositive = collectFixedZIndexPositive(root);
  const cinematicLayerCompositor = collectPageCinematicCompositorNodes();
  const suspects = collectCompositorSuspects(root);

  return {
    url: window.location.href,
    viewport: { w: window.innerWidth, h: window.innerHeight },
    probes,
    fixedZIndexPositive,
    cinematicLayerCompositor,
    suspects,
  };
}

export function dumpTraveltrustDomCompositorAudit(report: DomCompositorAuditReport): DomCompositorAuditReport {
  console.group("[TT dom compositor audit]");
  console.log("url:", report.url);
  console.log("viewport:", report.viewport);
  for (const probe of report.probes) {
    console.group(`probe ${probe.point.id} (${probe.point.px},${probe.point.py}) — ${probe.point.label}`);
    console.table(
      probe.hits.map((h) => ({
        depth: h.depth,
        selector: h.selector,
        flags: h.flags.join(" | ") || "(none)",
        mixBlendMode: h.computed.mixBlendMode,
        backdropFilter: h.computed.backdropFilter,
        filter: h.computed.filter,
        opacity: h.computed.opacity,
        zIndex: h.computed.zIndex,
        position: h.computed.position,
        maskImage: h.computed.maskImage !== "none" ? h.computed.maskImage.slice(0, 48) : "none",
        backgroundImage:
          h.computed.backgroundImage !== "none" ? h.computed.backgroundImage.slice(0, 48) : "none",
      })),
    );
    probe.hits.forEach((h) => {
      if (h.flags.length || h.pseudo?.before || h.pseudo?.after) {
        console.log(`depth=${h.depth}`, h.selector, h.computed, h.pseudo);
      }
    });
    console.groupEnd();
  }
  console.group("position:fixed + z-index>0");
  console.table(
    report.fixedZIndexPositive.map((n) => ({
      zIndex: n.zIndex,
      selector: n.selector,
      flags: n.flags.join(" | ") || "(none)",
      rect: `${n.rect.x},${n.rect.y} ${n.rect.w}x${n.rect.h}`,
      mixBlendMode: n.computed.mixBlendMode,
      backdropFilter: n.computed.backdropFilter,
    })),
  );
  console.groupEnd();
  console.group(`page-cinematic-3d compositor (${report.cinematicLayerCompositor.length})`);
  console.table(
    report.cinematicLayerCompositor.map((n) => ({
      z: n.zIndex,
      pos: n.position,
      selector: n.selector,
      flags: n.flags.join(" | "),
    })),
  );
  console.groupEnd();
  console.group(`compositor suspects (${report.suspects.length})`);
  console.table(report.suspects.slice(0, 80).map((s) => ({ selector: s.selector, reason: s.reason.join(" | ") })));
  console.groupEnd();
  console.groupEnd();
  return report;
}

export function installTraveltrustDomCompositorAuditApi(): DomCompositorAuditReport {
  const api = {
    probePoints: TT_DOM_COMPOSITOR_PROBE_POINTS,
    probeAt(x: number, y: number) {
      const row = probeElementsFromPoint(x, y);
      console.table(row.hits);
      return row;
    },
    runDefault() {
      return runTraveltrustDomCompositorAudit();
    },
    dump() {
      return dumpTraveltrustDomCompositorAudit(runTraveltrustDomCompositorAudit());
    },
    fixedNodes() {
      const rows = collectFixedZIndexPositive();
      console.table(rows);
      return rows;
    },
  };
  (window as unknown as { __ttDomCompositorAudit?: typeof api }).__ttDomCompositorAudit = api;
  return dumpTraveltrustDomCompositorAudit(runTraveltrustDomCompositorAudit());
}
