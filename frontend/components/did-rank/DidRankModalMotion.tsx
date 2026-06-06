"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useFocusTrap } from "@/hooks/useFocusTrap";

const ease = [0.22, 1, 0.36, 1] as const;

/** 战绩 / 向导弹窗 · L5 进出场（尊重 prefers-reduced-motion） */
export function DidRankModalMotion({
  onClose,
  ariaLabelledBy,
  ariaDescribedBy,
  shellClassName,
  children,
}: {
  onClose: () => void;
  ariaLabelledBy: string;
  ariaDescribedBy?: string;
  shellClassName: string;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const focusTrapRef = useFocusTrap(true, onClose);
  const transition = reduceMotion ? { duration: 0.01 } : { duration: 0.32, ease };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={transition}
    >
      <motion.div
        className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
        aria-hidden
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={reduceMotion ? undefined : { opacity: 0 }}
        transition={transition}
        onClick={onClose}
      />
      <motion.div
        ref={focusTrapRef}
        className={shellClassName}
        initial={reduceMotion ? false : { opacity: 0, scale: 0.94, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96, y: 8 }}
        transition={transition}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
