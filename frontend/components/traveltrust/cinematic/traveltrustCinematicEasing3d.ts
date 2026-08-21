/** 0–1 平滑插值，用于滚动驱动 3D */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge0 === edge1) return x >= edge1 ? 1 : 0;
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** 滚动缩放等需要「慢进慢出」的缓动 */
export function easeInOutCubic(t: number): number {
  const u = Math.max(0, Math.min(1, t));
  return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
}

/** 帧间阻尼，避免 scroll 驱动 scale 突变 */
export function damp(current: number, target: number, delta: number, lambda = 3.2): number {
  return current + (target - current) * (1 - Math.exp(-lambda * Math.max(0, delta)));
}

/** 十六进制颜色平滑过渡（用于角色环 3D） */
export function lerpHex(from: string, to: string, t: number): string {
  const clamp = Math.max(0, Math.min(1, t));
  const parse = (hex: string) => {
    const h = hex.replace("#", "");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  };
  const [r0, g0, b0] = parse(from);
  const [r1, g1, b1] = parse(to);
  const r = Math.round(lerp(r0, r1, clamp));
  const g = Math.round(lerp(g0, g1, clamp));
  const b = Math.round(lerp(b0, b1, clamp));
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}
