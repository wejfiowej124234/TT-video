"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useTranslation } from "@/components/LocaleProvider";

function subscribePrefersReducedMotion(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getPrefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const COLORS = {
  city: "rgba(96, 165, 250, 0.88)",
  order: "rgba(52, 211, 153, 0.84)",
  hub: "rgba(192, 132, 252, 0.86)",
  hot: "rgba(251, 146, 60, 0.84)",
} as const;

function pickKind(i: number): keyof typeof COLORS {
  const r = i % 10;
  if (r < 4) return "city";
  if (r < 7) return "order";
  if (r < 9) return "hub";
  return "hot";
}

const TIP_KEYS: Record<keyof typeof COLORS, string> = {
  city: "traveltrust_particle_tip_city",
  order: "traveltrust_particle_tip_order",
  hub: "traveltrust_particle_tip_hub",
  hot: "traveltrust_particle_tip_hot",
};

function drawTooltip(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  mx: number,
  my: number,
  text: string
) {
  ctx.save();
  ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
  const tw = ctx.measureText(text).width;
  const th = 18;
  const pad = 8;
  let px = mx + 12;
  let py = my - 36;
  if (px + tw + pad * 2 > w - 4) px = Math.max(4, w - tw - pad * 2 - 4);
  if (py < 4) py = my + 16;
  ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
  ctx.beginPath();
  const r = 5;
  const x0 = px - pad;
  const y0 = py - 14;
  const bw = tw + pad * 2;
  const bh = th;
  ctx.moveTo(x0 + r, y0);
  ctx.lineTo(x0 + bw - r, y0);
  ctx.quadraticCurveTo(x0 + bw, y0, x0 + bw, y0 + r);
  ctx.lineTo(x0 + bw, y0 + bh - r);
  ctx.quadraticCurveTo(x0 + bw, y0 + bh, x0 + bw - r, y0 + bh);
  ctx.lineTo(x0 + r, y0 + bh);
  ctx.quadraticCurveTo(x0, y0 + bh, x0, y0 + bh - r);
  ctx.lineTo(x0, y0 + r);
  ctx.quadraticCurveTo(x0, y0, x0 + r, y0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#f1f5f9";
  ctx.fillText(text, px, py);
  ctx.restore();
}

function drawNetwork(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  particles: { x: number; y: number; vx: number; vy: number; r: number; kind: keyof typeof COLORS }[],
  maxDist: number,
  animate: boolean,
  opts: {
    pointer: { x: number; y: number } | null;
    flash: { i: number; j: number; until: number } | null;
    now: number;
    labelFor: (kind: keyof typeof COLORS, idx: number) => string;
    interactive: boolean;
    /** 键盘焦点节点：与 pointer 互斥展示（pointer 优先） */
    keyboardFocusIndex: number | null;
    /** >1 时连线更亮（Hero 内嵌画布） */
    lineMul?: number;
  }
) {
  ctx.clearRect(0, 0, w, h);

  if (animate) {
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;
    }
  }

  const md2 = maxDist * maxDist;
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a = particles[i]!;
      const b = particles[j]!;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < md2 && d2 > 0) {
        const d = Math.sqrt(d2);
        const mul = opts.lineMul ?? 1;
        const alpha = (1 - d / maxDist) * 0.14 * mul;
        ctx.strokeStyle =
          mul > 1.4 ? `rgba(45, 212, 191, ${alpha * 0.95})` : `rgba(100, 116, 139, ${alpha})`;
        ctx.lineWidth = mul > 1.4 ? 0.75 : 0.55;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  const flash = opts.flash;
  if (flash && opts.now < flash.until) {
    const a = particles[flash.i];
    const b = particles[flash.j];
    if (a && b) {
      ctx.save();
      ctx.strokeStyle = "rgba(249, 215, 121, 0.78)";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 7]);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.restore();
    }
  }

  for (const p of particles) {
    ctx.beginPath();
    ctx.fillStyle = COLORS[p.kind];
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  const kb = opts.keyboardFocusIndex;
  if (opts.interactive && kb != null && particles[kb]) {
    const p = particles[kb]!;
    ctx.save();
    ctx.strokeStyle = "rgba(249, 215, 121, 0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r + 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (opts.interactive && particles.length > 0) {
    if (opts.pointer) {
      const { x: mx, y: my } = opts.pointer;
      let best = -1;
      let bestD = Infinity;
      const hoverRadius = 30;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]!;
        const d = Math.hypot(p.x - mx, p.y - my) - p.r;
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      if (best >= 0 && bestD < hoverRadius) {
        const p = particles[best]!;
        const text = opts.labelFor(p.kind, best);
        drawTooltip(ctx, w, h, mx, my, text);
      }
    } else if (kb != null && particles[kb]) {
      const p = particles[kb]!;
      const text = opts.labelFor(p.kind, kb);
      drawTooltip(ctx, w, h, p.x + 14, p.y - 6, text);
    }
  }
}

type Props = {
  className?: string;
  frameClassName?: string;
  /** `hero`：更高对比连线与略大节点，用于首屏内嵌 */
  tone?: "card" | "hero";
};

/**
 * 85 §2.5 / §五 / §5.3：Canvas 2D 粒子；Hover 演示 tooltip；Click 示意路径；尊重 prefers-reduced-motion。
 * Live Network（card）未减动效时：Tab 聚焦画布后方向键切换节点，Enter 或 Space 触发与点击相同的高亮路径。
 */
export default function TravelTrustNetworkParticles({
  className = "",
  frameClassName = "h-56 sm:h-72",
  tone = "card",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t, locale } = useTranslation();
  const canvasLabel = t("traveltrust_liveNetwork_canvas_label");
  const canvasKbHint = t("traveltrust_liveNetwork_canvas_kb_hint");
  const reduceMotionPref = useSyncExternalStore(
    subscribePrefersReducedMotion,
    getPrefersReducedMotion,
    () => false
  );
  const showKeyboardOnCanvas = tone === "card" && !reduceMotionPref;
  const canvasAriaLabel = `${canvasLabel} ${canvasKbHint}`.trim();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let motionQuery: MediaQueryList | null = null;
    let ro: ResizeObserver | null = null;

    const pointer = { x: 0, y: 0, active: false };
    const keyboard = { focused: false, idx: 0 };
    let flashState: { i: number; j: number; until: number } | null = null;

    const state = {
      w: 1,
      h: 1,
      dpr: 1,
      reduceMotion: false,
      particles: [] as {
        x: number;
        y: number;
        vx: number;
        vy: number;
        r: number;
        kind: keyof typeof COLORS;
      }[],
    };

    const labelFor = (kind: keyof typeof COLORS, idx: number) => {
      const n = 12 + (idx * 19) % 38;
      return t(TIP_KEYS[kind]).replace(/\{\{n\}\}/g, String(n));
    };

    const particleCount = () => {
      if (state.reduceMotion) return 10;
      const narrow = typeof window !== "undefined" && window.innerWidth < 640;
      const base = narrow ? 42 : Math.min(78, 80);
      return tone === "hero" ? Math.min(92, Math.round(base * 1.18)) : base;
    };

    const initParticles = () => {
      const n = particleCount();
      const { w, h } = state;
      state.particles = [];
      for (let i = 0; i < n; i++) {
        const rMul = tone === "hero" ? 1.22 : 1;
        state.particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: state.reduceMotion ? 0 : (Math.random() - 0.5) * 0.42,
          vy: state.reduceMotion ? 0 : (Math.random() - 0.5) * 0.42,
          r: (1.1 + Math.random() * 2.1) * rMul,
          kind: pickKind(i),
        });
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      state.dpr = Math.min(window.devicePixelRatio || 1, 2);
      state.w = Math.max(1, rect.width);
      state.h = Math.max(1, rect.height);
      canvas.width = state.w * state.dpr;
      canvas.height = state.h * state.dpr;
      ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
      initParticles();
      if (state.particles.length > 0) {
        keyboard.idx = Math.max(0, Math.min(keyboard.idx, state.particles.length - 1));
      }
    };

    const clientToLocal = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const onMove = (clientX: number, clientY: number) => {
      if (state.reduceMotion) return;
      const p = clientToLocal(clientX, clientY);
      pointer.x = p.x;
      pointer.y = p.y;
      pointer.active = true;
    };

    const onLeave = () => {
      pointer.active = false;
    };

    const triggerFlashAtIndex = (best: number) => {
      if (state.reduceMotion || state.particles.length < 2) return;
      if (best < 0 || best >= state.particles.length) return;
      let j = (best + 5 + Math.floor(Math.random() * (state.particles.length - 1))) % state.particles.length;
      if (j === best) j = (j + 1) % state.particles.length;
      flashState = { i: best, j, until: performance.now() + 2200 };
    };

    const onClick = (clientX: number, clientY: number) => {
      if (state.reduceMotion || state.particles.length < 2) return;
      const { x, y } = clientToLocal(clientX, clientY);
      let best = -1;
      let bestD = Infinity;
      const clickRadius = 36;
      for (let i = 0; i < state.particles.length; i++) {
        const p = state.particles[i]!;
        const d = Math.hypot(p.x - x, p.y - y) - p.r;
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      if (best < 0 || bestD > clickRadius) return;
      triggerFlashAtIndex(best);
    };

    const keyboardFocusForDraw = (): number | null => {
      if (state.reduceMotion || !keyboard.focused || pointer.active || state.particles.length === 0) return null;
      return Math.max(0, Math.min(keyboard.idx, state.particles.length - 1));
    };

    const tick = () => {
      const maxDist = Math.min(tone === "hero" ? 132 : 118, state.w * (tone === "hero" ? 0.155 : 0.14));
      const now = performance.now();
      const lineMul = tone === "hero" ? 2.35 : 1;
      drawNetwork(ctx, state.w, state.h, state.particles, maxDist, !state.reduceMotion, {
        pointer: pointer.active ? { x: pointer.x, y: pointer.y } : null,
        flash: flashState,
        now,
        labelFor,
        interactive: !state.reduceMotion,
        keyboardFocusIndex: keyboardFocusForDraw(),
        lineMul,
      });
      if (flashState && now >= flashState.until) flashState = null;
      if (!state.reduceMotion) {
        raf = requestAnimationFrame(tick);
      }
    };

    motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => {
      state.reduceMotion = motionQuery!.matches;
      pointer.active = false;
      keyboard.focused = false;
      flashState = null;
      initParticles();
      cancelAnimationFrame(raf);
      if (state.reduceMotion) {
        const maxDist = Math.min(tone === "hero" ? 132 : 118, state.w * (tone === "hero" ? 0.155 : 0.14));
        drawNetwork(ctx, state.w, state.h, state.particles, maxDist, false, {
          pointer: null,
          flash: null,
          now: performance.now(),
          labelFor,
          interactive: false,
          keyboardFocusIndex: null,
          lineMul: tone === "hero" ? 2.35 : 1,
        });
      } else {
        tick();
      }
    };
    state.reduceMotion = motionQuery.matches;
    motionQuery.addEventListener("change", onMotion);

    const onMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const onMouseLeave = () => onLeave();
    const onMouseClick = (e: MouseEvent) => onClick(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) onMove(touch.clientX, touch.clientY);
    };

    const onCanvasFocus = () => {
      if (state.reduceMotion) return;
      keyboard.focused = true;
      if (state.particles.length > 0) {
        keyboard.idx = Math.max(0, Math.min(keyboard.idx, state.particles.length - 1));
      }
    };

    const onCanvasBlur = () => {
      keyboard.focused = false;
    };

    const onCanvasKeyDown = (e: KeyboardEvent) => {
      if (state.reduceMotion || !keyboard.focused) return;
      const n = state.particles.length;
      if (n < 1) return;
      keyboard.idx = Math.max(0, Math.min(keyboard.idx, n - 1));
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          keyboard.idx = (keyboard.idx + 1) % n;
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          keyboard.idx = (keyboard.idx - 1 + n) % n;
          break;
        case "Home":
          e.preventDefault();
          keyboard.idx = 0;
          break;
        case "End":
          e.preventDefault();
          keyboard.idx = n - 1;
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          triggerFlashAtIndex(keyboard.idx);
          break;
        default:
          return;
      }
    };

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("click", onMouseClick);
    canvas.addEventListener("touchmove", onTouchMove, { passive: true });
    canvas.addEventListener("focus", onCanvasFocus);
    canvas.addEventListener("blur", onCanvasBlur);
    canvas.addEventListener("keydown", onCanvasKeyDown);

    ro = new ResizeObserver(() => {
      resize();
      cancelAnimationFrame(raf);
      if (state.reduceMotion) {
        const maxDist = Math.min(tone === "hero" ? 132 : 118, state.w * (tone === "hero" ? 0.155 : 0.14));
        drawNetwork(ctx, state.w, state.h, state.particles, maxDist, false, {
          pointer: null,
          flash: null,
          now: performance.now(),
          labelFor,
          interactive: false,
          keyboardFocusIndex: null,
          lineMul: tone === "hero" ? 2.35 : 1,
        });
      } else {
        tick();
      }
    });
    ro.observe(canvas);
    resize();

    if (state.reduceMotion) {
      const maxDist = Math.min(tone === "hero" ? 132 : 118, state.w * (tone === "hero" ? 0.155 : 0.14));
      drawNetwork(ctx, state.w, state.h, state.particles, maxDist, false, {
        pointer: null,
        flash: null,
        now: performance.now(),
        labelFor,
        interactive: false,
        keyboardFocusIndex: null,
        lineMul: tone === "hero" ? 2.35 : 1,
      });
    } else {
      tick();
    }

    return () => {
      motionQuery?.removeEventListener("change", onMotion);
      ro?.disconnect();
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      canvas.removeEventListener("click", onMouseClick);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("focus", onCanvasFocus);
      canvas.removeEventListener("blur", onCanvasBlur);
      canvas.removeEventListener("keydown", onCanvasKeyDown);
    };
  }, [t, locale, tone]);

  const frameTone =
    tone === "hero"
      ? `relative overflow-hidden rounded-none border-0 bg-slate-950/25 ring-0 shadow-none backdrop-blur-[2px] ${frameClassName} ${className}`
      : `relative overflow-hidden rounded-[var(--radius-md)] border border-ink-200/80 bg-bg-console ${frameClassName} ${className}`;

  const cardDecorative = tone === "card" && reduceMotionPref;
  const canvasCls =
    tone === "hero"
      ? "absolute inset-0 h-full w-full cursor-crosshair touch-none"
      : `absolute inset-0 h-full w-full cursor-crosshair touch-none outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/55 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900`;

  return (
    <div
      className={frameTone}
      role={tone === "hero" ? "presentation" : cardDecorative ? "img" : undefined}
      aria-hidden={tone === "hero" ? true : undefined}
      aria-label={tone === "hero" ? undefined : cardDecorative ? canvasLabel : undefined}
    >
      <canvas
        ref={canvasRef}
        tabIndex={showKeyboardOnCanvas ? 0 : -1}
        className={canvasCls}
        role={showKeyboardOnCanvas ? "img" : undefined}
        aria-hidden={tone === "hero" || cardDecorative ? true : undefined}
        aria-label={showKeyboardOnCanvas ? canvasAriaLabel : undefined}
      />
    </div>
  );
}
