"use client";

import { motion, useReducedMotion } from "framer-motion";

const ROUTES = [
  "M-20 280 C 120 120, 280 320, 420 180 S 680 80, 820 220",
  "M-40 320 C 80 200, 200 360, 360 240 S 620 160, 860 280",
  "M0 200 C 160 80, 320 280, 500 140 S 720 40, 840 180",
] as const;

/** 身份剧场背景：慢速航线弧（86 · 环境动效，非数据真值） */
export function TravelTrustRouteArc() {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;

  return (
    <div className="pointer-events-none absolute -inset-x-8 top-8 bottom-0 z-0 overflow-hidden opacity-40" aria-hidden>
      <svg className="h-full w-full" viewBox="0 0 800 400" preserveAspectRatio="none">
        <defs>
          <linearGradient id="tt-route-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(35, 206, 217)" stopOpacity="0" />
            <stop offset="35%" stopColor="rgb(35, 206, 217)" stopOpacity="0.55" />
            <stop offset="65%" stopColor="rgb(252, 164, 124)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="rgb(12, 110, 105)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ROUTES.map((d, i) => (
          <motion.path
            key={d}
            d={d}
            fill="none"
            stroke="url(#tt-route-grad)"
            strokeWidth={i === 0 ? 1.25 : 0.9}
            strokeLinecap="round"
            strokeDasharray={i === 0 ? undefined : "6 14"}
            initial={{ pathLength: 0, opacity: 0.25 }}
            animate={{
              pathLength: 1,
              opacity: [0.3, 0.65, 0.3],
              strokeDashoffset: i === 0 ? 0 : [0, -40, 0],
            }}
            transition={{
              pathLength: { duration: 2.4 + i * 0.4, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: 10 + i * 2, repeat: Infinity, ease: "easeInOut" },
              strokeDashoffset: { duration: 12 + i * 3, repeat: Infinity, ease: "linear" },
            }}
          />
        ))}
      </svg>
      <motion.div
        className="absolute left-[18%] top-[42%] h-1 w-1 rounded-full bg-ref-cyan/90 shadow-[0_0_10px_rgba(35,206,217,0.9)]"
        animate={{ x: [0, 220, 420, 220, 0], y: [0, -40, 20, 60, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
