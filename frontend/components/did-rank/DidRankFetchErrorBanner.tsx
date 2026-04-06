"use client";

import { type FormEvent } from "react";

/** API 拉取失败时提示重试；列表为空或仅显示本周期缓存，不使用本地示例排名。与奖池/Header 真内容或骨架并列时由页面外包 `gap`，勿再叠 `mb-4`。 */
export default function DidRankFetchErrorBanner({
  fetchError,
  onRetry,
  t,
  className = "",
}: {
  fetchError: string | null;
  onRetry: () => void;
  t: (key: string) => string;
  /** 并入页身竖向栈时追加（如 `order-*`）；默认无外边距 */
  className?: string;
}) {
  if (!fetchError) return null;
  return (
    <div
      role="alert"
      aria-live="polite"
      className={`rounded-[var(--radius-lg)] border border-ref-coral/35 bg-slate-900/55 backdrop-blur-md px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap text-slate-300 ring-1 ring-ref-cyan/15 shadow-[0_0_28px_-8px_rgba(252,164,124,0.15)] motion-sub${className ? ` ${className}` : ""}`}
    >
      <p className="text-meta flex items-center gap-2 min-w-0 flex-1">
        <span className="text-ref-coral shrink-0" aria-hidden>
          ℹ
        </span>
        <span>{t("didRank_fetchFailedHint")}</span>
      </p>
      <form
        className="shrink-0"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          onRetry();
        }}
      >
        <button
          type="submit"
          className="rounded-[var(--radius-sm)] border border-ref-cyan/45 bg-ref-cyan/10 px-4 py-2 text-meta font-medium text-ref-cyan hover:bg-ref-cyan/20 motion-sub min-h-[44px] inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/55 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          {t("didRank_retry")}
        </button>
      </form>
    </div>
  );
}
