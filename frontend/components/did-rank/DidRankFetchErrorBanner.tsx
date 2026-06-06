"use client";

import { type FormEvent } from "react";
import { TT_MARKETING_BTN_MARKET_PRIMARY, TT_MARKETING_DID_RANK_SURFACE } from "@/lib/marketingUi";

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
      className={`${TT_MARKETING_DID_RANK_SURFACE.fetchErrorBanner}${className ? ` ${className}` : ""}`}
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
          className={`${TT_MARKETING_BTN_MARKET_PRIMARY} motion-sub`}
        >
          {t("didRank_retry")}
        </button>
      </form>
    </div>
  );
}
