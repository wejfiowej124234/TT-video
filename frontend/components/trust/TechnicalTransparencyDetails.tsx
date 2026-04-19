"use client";

import type { ReactNode } from "react";
import { useId } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { deepShellPillControlFocusClasses, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

export type TechnicalTransparencyDetailsProps = {
  surface: "ink" | "slate";
  /** 已验证时展示的技术摘要行（短哈希等） */
  children?: ReactNode;
};

/**
 * P-UX1：技术细节折叠 — 默认收起，避免哈希干扰主叙事。
 */
export default function TechnicalTransparencyDetails({ surface, children }: TechnicalTransparencyDetailsProps) {
  const { t } = useTranslation();
  const sid = useId();
  const sumClass =
    surface === "slate"
      ? `cursor-pointer list-none rounded-sm text-meta text-cyan-300 hover:text-cyan-100 [&::-webkit-details-marker]:hidden min-h-[44px] flex items-center -mx-1 px-1 ${deepShellPillControlFocusClasses}`
      : `cursor-pointer list-none rounded-[var(--radius-sm)] text-meta text-travel-700 hover:text-travel-900 [&::-webkit-details-marker]:hidden min-h-[44px] flex items-center ${travelFocusRingOffset2Classes}`;

  const box =
    surface === "slate"
      ? "mt-3 rounded-[var(--radius-md)] border border-slate-600/50 bg-slate-950/40 px-3 py-2"
      : "mt-3 rounded-[var(--radius-md)] border border-ink-200 bg-white/80 px-3 py-2";

  const inner =
    surface === "slate"
      ? "mt-2 border-t border-slate-600/40 pt-2 text-meta text-slate-300"
      : "mt-2 border-t border-ink-200 pt-2 text-meta text-ink-600";

  return (
    <details className={box}>
      <summary id={sid} className={sumClass}>
        {t("pux1_technical_toggle")}
      </summary>
      <div className={inner}>{children}</div>
    </details>
  );
}
