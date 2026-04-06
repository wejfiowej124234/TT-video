"use client";

/** B-068：钱包 RPC / `readContract` 失败时链上状态区显式降级（非沿用陈旧缓存冒充最新） */

export interface EscrowChainReadDegradedBannerProps {
  /** `Date.now()` 或 Query `dataUpdatedAt`（ms） */
  lastChainContractReadOkAt: number | null;
  t: (key: string) => string;
}

export default function EscrowChainReadDegradedBanner({
  lastChainContractReadOkAt,
  t,
}: EscrowChainReadDegradedBannerProps) {
  const lastOkText =
    lastChainContractReadOkAt != null && lastChainContractReadOkAt > 0
      ? t("escrow_chainReadDegraded_lastOk").replace(
          "{{time}}",
          new Date(lastChainContractReadOkAt).toLocaleString(undefined, {
            dateStyle: "short",
            timeStyle: "medium",
          }),
        )
      : t("escrow_chainReadDegraded_noCache");

  return (
    <div
      className="rounded-[var(--radius-md)] border border-amber-500/45 bg-amber-500/10 p-4 space-y-1"
      role="status"
    >
      <p className="text-small font-semibold text-amber-200">{t("escrow_chainReadDegraded_title")}</p>
      <p className="text-small text-slate-200 leading-relaxed">{t("escrow_chainReadDegraded_body")}</p>
      <p className="text-meta text-slate-400">{lastOkText}</p>
    </div>
  );
}
