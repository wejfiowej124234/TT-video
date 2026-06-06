"use client";

import type { ReactNode } from "react";
import { meOnboardingDevUiEnabled } from "@/lib/me/meOnboardingDevGate";
import { TT_ME_ONBOARDING_L5 } from "@/lib/me/meOnboardingL5";

export function MeOnboardingSummaryGrid({ children }: { children: ReactNode }) {
  return <dl className={TT_ME_ONBOARDING_L5.summaryGrid}>{children}</dl>;
}

export function MeOnboardingSummaryItem({
  label,
  value,
  meta,
}: {
  label: string;
  value: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <div className={TT_ME_ONBOARDING_L5.summaryRow}>
      <dt className={TT_ME_ONBOARDING_L5.summaryLabel}>{label}</dt>
      <dd className={TT_ME_ONBOARDING_L5.summaryValue}>{value}</dd>
      {meta ? <dd className={TT_ME_ONBOARDING_L5.summaryMeta}>{meta}</dd> : null}
    </div>
  );
}

export function MeOnboardingStatusPill({
  status,
  variant,
}: {
  status: string;
  /** 语义色；避免 i18n 文案与英文关键字不匹配 */
  variant?: "paid" | "pending" | "neutral";
}) {
  const normalized = status.toLowerCase();
  const tone =
    variant === "paid" ||
    (!variant && (normalized === "paid" || normalized === "active" || normalized.includes("已支付")))
      ? TT_ME_ONBOARDING_L5.statusPillPaid
      : variant === "pending" ||
          (!variant && (normalized === "pending" || normalized === "stub" || normalized.includes("待")))
        ? TT_ME_ONBOARDING_L5.statusPillPending
        : TT_ME_ONBOARDING_L5.statusPillNeutral;
  return <span className={`${TT_ME_ONBOARDING_L5.statusPillBase} ${tone}`}>{status}</span>;
}

export function MeOnboardingTechnicalDetails({
  label,
  json,
}: {
  label: string;
  json: unknown;
}) {
  if (json == null || !meOnboardingDevUiEnabled()) return null;
  return (
    <details className={TT_ME_ONBOARDING_L5.technicalDetails}>
      <summary className="cursor-pointer px-3 py-2 font-medium text-ink-700">{label}</summary>
      <pre className="max-h-48 overflow-auto border-t border-ink-100 px-3 py-2 text-meta text-ink-800 whitespace-pre-wrap break-words">
        {JSON.stringify(json, null, 2)}
      </pre>
    </details>
  );
}
