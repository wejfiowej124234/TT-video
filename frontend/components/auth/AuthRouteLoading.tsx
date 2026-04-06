"use client";

import { useTranslation } from "@/components/LocaleProvider";

export type AuthRouteLoadingVariant = "narrow" | "register";

/**
 * 认证子路由共用骨架：与 login / register 等居中卡片表单壳一致。
 * mainAriaLabelKey：与对应页 `main` 的 `aria-label` 所用 locales 键一致（默认可感知加载）。
 */
export default function AuthRouteLoading({
  variant = "narrow",
  mainAriaLabelKey = "common_loading",
  /** 为 true 时仅渲染卡片骨架，供外层 `main` + `Suspense` 包裹（与 login 等布局一致） */
  embedded = false,
}: {
  variant?: AuthRouteLoadingVariant;
  mainAriaLabelKey?: string;
  embedded?: boolean;
}) {
  const { t } = useTranslation();
  const maxClass = variant === "register" ? "max-w-md" : "max-w-sm";
  const fieldRows = variant === "register" ? 5 : 2;
  const card = (
    <div
      className={`w-full ${maxClass} rounded-[var(--radius-sm)] border border-ink-200 bg-bg-console shadow-soft p-6`}
      aria-hidden
    >
      <div className="min-h-[44px] h-11 w-40 bg-ink-200 rounded-[var(--radius-sm)] animate-pulse" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: fieldRows }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-20 bg-ink-200 rounded-[var(--radius-sm)] animate-pulse" />
            <div className="min-h-[44px] h-11 w-full border border-ink-200 rounded-[var(--radius-sm)] bg-bg-main animate-pulse" />
          </div>
        ))}
        <div className="min-h-[44px] h-11 w-full rounded-[var(--radius-sm)] bg-travel-500/25 border border-travel-500/40 animate-pulse" />
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <div className="h-4 w-24 bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
        <div className="h-4 w-28 bg-ink-100 rounded-[var(--radius-sm)] animate-pulse" />
      </div>
    </div>
  );
  if (embedded) return card;
  return (
    <main
      className="min-h-screen bg-bg-main flex items-center justify-center p-6"
      role="status"
      aria-label={t(mainAriaLabelKey)}
      aria-busy="true"
    >
      {card}
    </main>
  );
}
