"use client";

import { useTranslation } from "@/components/LocaleProvider";

/**
 * 根 `loading.tsx`：路由切换 / RSC 未就绪时替换 **`layout` 的 `children`（仅 `#main-content` 内页体）**。
 * 若仅渲染顶栏细线，主区近乎空白，易被误认为「全站 UI 没了」；此处保留顶栏进度条 + **主区可见骨架**（52 §7.5 / 与 `AuthRouteLoading` 同系）。
 */
export default function Loading() {
  const { t } = useTranslation();
  return (
    <>
      <div
        className="fixed left-0 top-0 right-0 z-[400] h-0.5 bg-travel-500 animate-pulse"
        role="progressbar"
        aria-valuenow={undefined}
        aria-label={t("common_loading")}
      />
      <div
        className="relative flex w-full min-h-[min(60vh,calc(100vh-5rem))] flex-col items-center justify-center gap-4 px-4 py-10"
        role="status"
        aria-busy="true"
        aria-label={t("common_loading")}
      >
        <div
          className="w-full max-w-sm rounded-[var(--radius-sm)] border border-ink-200 bg-bg-console p-6 shadow-soft"
          aria-hidden
        >
          <div className="mx-auto min-h-[44px] h-11 w-44 rounded-[var(--radius-md)] bg-ink-200 animate-pulse" />
          <div className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <div className="h-3 w-16 rounded-[var(--radius-sm)] bg-ink-100 animate-pulse" />
              <div className="min-h-[44px] w-full rounded-[var(--radius-sm)] border border-ink-200 bg-bg-main animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-20 rounded-[var(--radius-sm)] bg-ink-100 animate-pulse" />
              <div className="min-h-[44px] w-full rounded-[var(--radius-sm)] border border-ink-200 bg-bg-main animate-pulse" />
            </div>
            <div className="min-h-[44px] w-full rounded-[var(--radius-sm)] bg-travel-500/20 border border-travel-500/35 animate-pulse" />
          </div>
        </div>
        <p className="text-small text-ink-500 motion-sub">{t("common_loading")}</p>
      </div>
    </>
  );
}
