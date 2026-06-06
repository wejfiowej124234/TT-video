"use client";

import { motion, useReducedMotion } from "framer-motion";

export function TravelTrustHorizonArc() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative -mt-1 h-16 w-full overflow-hidden sm:h-20" aria-hidden>
      <svg className="absolute bottom-0 left-0 h-full w-full" viewBox="0 0 1440 80" preserveAspectRatio="none">
        <defs>
          <linearGradient id="tt-horizon-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(46, 111, 255)" stopOpacity="0.85" />
            <stop offset="50%" stopColor="rgb(35, 206, 217)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="rgb(0, 179, 164)" stopOpacity="0.85" />
          </linearGradient>
        </defs>
        <path
          d="M0 72 Q360 8 720 40 T1440 56 L1440 80 L0 80 Z"
          fill="rgba(20,16,13,0.92)"
          stroke="url(#tt-horizon-grad)"
          strokeWidth="1.5"
          opacity="0.9"
        />
      </svg>
      {!reduceMotion ? (
        <motion.div
          className="absolute bottom-6 left-[15%] h-1.5 w-1.5 rounded-full bg-ref-cyan/80 shadow-[0_0_8px_rgba(35,206,217,0.8)]"
          animate={{ x: [0, 180, 360, 180, 0], opacity: [0.4, 1, 0.6, 1, 0.4] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}
    </div>
  );
}
