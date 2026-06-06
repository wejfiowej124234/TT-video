"use client";

import { Children, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

/** 奖池 + 标题区 · 首屏 stagger 入场 */
export function DidRankPreboardEnter({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <>{children}</>;

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } },
      }}
    >
      {Children.map(children, (child, i) => (
        <motion.div
          key={i}
          variants={{
            hidden: { opacity: 0, y: 12 },
            show: { opacity: 1, y: 0, transition: { duration: 0.38, ease } },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
