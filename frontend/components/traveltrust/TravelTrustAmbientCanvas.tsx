"use client";

import { useEffect, useRef } from "react";

/** 全页环境粒子：青绿连线 + 四色节点，慢漂移；无交互，尊重 prefers-reduced-motion */
const NODE = {
  city: "rgba(125, 211, 252, 0.88)",
  order: "rgba(110, 231, 183, 0.86)",
  hub: "rgba(196, 181, 253, 0.86)",
  hot: "rgba(251, 191, 36, 0.88)",
} as const;

function pickKind(i: number): keyof typeof NODE {
  const r = i % 10;
  if (r < 4) return "city";
  if (r < 7) return "order";
  if (r < 9) return "hub";
  return "hot";
}

export default function TravelTrustAmbientCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let ro: ResizeObserver | null = null;
    let mq: MediaQueryList | null = null;

    type P = { x: number; y: number; vx: number; vy: number; r: number; kind: keyof typeof NODE };
    const state = { w: 1, h: 1, dpr: 1, reduce: false, particles: [] as P[] };

    const targetCount = () => {
      if (state.reduce) return 24;
      const area = state.w * state.h;
      return Math.min(78, Math.max(36, Math.floor(area / 16000)));
    };

    const init = () => {
      const n = targetCount();
      state.particles = [];
      for (let i = 0; i < n; i++) {
        state.particles.push({
          x: Math.random() * state.w,
          y: Math.random() * state.h,
          vx: state.reduce ? 0 : (Math.random() - 0.5) * 0.16,
          vy: state.reduce ? 0 : (Math.random() - 0.5) * 0.16,
          r: 1.35 + Math.random() * 2.6,
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
      init();
    };

    const draw = () => {
      const { w, h, particles } = state;
      ctx.clearRect(0, 0, w, h);

      if (!state.reduce) {
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x = w;
          if (p.x > w) p.x = 0;
          if (p.y < 0) p.y = h;
          if (p.y > h) p.y = 0;
        }
      }

      const maxDist = Math.min(150, w * 0.11);
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
            const alpha = (1 - d / maxDist) * 0.34;
            ctx.strokeStyle = `rgba(251, 191, 36, ${alpha * 0.58})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        ctx.beginPath();
        ctx.fillStyle = NODE[p.kind];
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const tick = () => {
      draw();
      if (!state.reduce) raf = requestAnimationFrame(tick);
    };

    mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => {
      state.reduce = mq!.matches;
      cancelAnimationFrame(raf);
      resize();
      if (state.reduce) draw();
      else tick();
    };

    state.reduce = mq.matches;
    mq.addEventListener("change", onMotion);

    ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      resize();
      if (state.reduce) draw();
      else tick();
    });
    ro.observe(canvas);
    resize();
    if (state.reduce) draw();
    else tick();

    return () => {
      mq?.removeEventListener("change", onMotion);
      ro?.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none fixed inset-0 z-[1] h-full w-full opacity-[0.68] motion-reduce:opacity-40"
      aria-hidden
    />
  );
}
