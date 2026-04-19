"use client";

import type { TransparencyTrustState } from "@/lib/trust/useAutoTransparencyVerification";

export type TrustStatusCalloutProps = {
  state: TransparencyTrustState;
  surface: "ink" | "slate";
  /** 主标题（自然语言） */
  headline: string;
  /** 说明一句 */
  body: string;
  /** 可选第三行（如最近校验时间） */
  subtle?: string | null;
};

function MeterDots({ state }: { state: TransparencyTrustState }) {
  return (
    <div className="flex shrink-0 gap-1.5 pt-0.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full transition-colors ${
            state === "verified"
              ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
              : state === "failed"
                ? i === 0
                  ? "bg-red-400"
                  : "bg-slate-500/50"
                : "bg-amber-400 motion-safe:animate-pulse"
          }`}
        />
      ))}
    </div>
  );
}

function StatusIcon({ state, surface }: { state: TransparencyTrustState; surface: "ink" | "slate" }) {
  const stroke = surface === "slate" ? "currentColor" : "currentColor";
  if (state === "verified") {
    return (
      <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${surface === "slate" ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-100 text-emerald-800"}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="10" stroke={stroke} strokeWidth="1.5" />
          <path d="M8 12l2.5 2.5L16 9" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (state === "failed") {
    return (
      <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${surface === "slate" ? "bg-red-500/15 text-red-300" : "bg-red-100 text-red-800"}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="1.5" />
          <path d="M9 9l6 6M15 9l-6 6" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
    );
  }
  return (
    <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${surface === "slate" ? "bg-amber-500/15 text-amber-200" : "bg-amber-100 text-amber-900"}`}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="1.5" className="motion-safe:animate-[spin_8s_linear_infinite]" />
        <path d="M12 7v5l3 2" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}

/**
 * P-UX1：可视化信任状态 — 自然语言标题 + 三色点阵 + 图标，弱化「系统行话」感。
 */
export default function TrustStatusCallout({ state, surface, headline, body, subtle }: TrustStatusCalloutProps) {
  const shell =
    surface === "slate"
      ? state === "verified"
        ? "border-emerald-500/35 bg-emerald-950/30"
        : state === "failed"
          ? "border-red-500/30 bg-red-950/20"
          : "border-amber-500/35 bg-amber-950/20"
      : state === "verified"
        ? "border-emerald-300 bg-emerald-50/90"
        : state === "failed"
          ? "border-red-200 bg-red-50/90"
          : "border-amber-200 bg-amber-50/90";

  const textTitle = surface === "slate" ? "text-body font-semibold text-slate-50" : "text-body font-semibold text-ink-900";
  const textBody = surface === "slate" ? "text-meta text-slate-300 leading-relaxed" : "text-meta text-ink-700 leading-relaxed";
  const textSub = surface === "slate" ? "text-meta text-slate-400" : "text-meta text-ink-500";

  return (
    <div className={`rounded-[var(--radius-md)] border px-3 py-3 sm:px-4 ${shell}`}>
      <div className="flex gap-3 sm:gap-4">
        <StatusIcon state={state} surface={surface} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={textTitle}>{headline}</p>
            <MeterDots state={state} />
          </div>
          <p className={`${textBody} mt-1`}>{body}</p>
          {subtle ? <p className={`${textSub} mt-1.5`}>{subtle}</p> : null}
        </div>
      </div>
    </div>
  );
}
