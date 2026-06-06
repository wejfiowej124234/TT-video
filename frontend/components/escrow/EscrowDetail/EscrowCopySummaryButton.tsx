"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { escrowExperienceGhostButtonClass } from "@/lib/escrowExperienceUi";
import { escrowProtocolFooterActionClass } from "@/lib/escrowProtocolUi";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2Classes,
} from "@/lib/travelLinkFocus";

const protocolDidButtonClass = `${escrowProtocolFooterActionClass} disabled:opacity-60 disabled:cursor-wait`;

const consoleButtonClass = `${touchTargetLink44Classes} inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-ink-300 bg-bg-console px-4 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 disabled:opacity-60 disabled:cursor-not-allowed motion-sub print:hidden ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`;

/** 53-S15 优化：与 e2e `getByRole('button', { name: /复制摘要|Copy summary/i })` 对齐 */
export default function EscrowCopySummaryButton({
  variant = "protocolDid",
  onCopy,
  busy = false,
  done = false,
  disabled = false,
}: {
  variant?: "protocolDid" | "console" | "experience";
  onCopy: () => void | Promise<void>;
  busy?: boolean;
  done?: boolean;
  /** 无订单数据时占位，仅保证地标可见 */
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const cls =
    variant === "experience"
      ? `${escrowExperienceGhostButtonClass} motion-sub print:hidden disabled:opacity-60 disabled:cursor-wait`
      : variant === "protocolDid"
        ? protocolDidButtonClass
        : consoleButtonClass;
  const isDisabled = disabled || busy;
  return (
    <form
      className="inline"
      onSubmit={(e) => {
        e.preventDefault();
        if (!isDisabled) void onCopy();
      }}
    >
      <button
        type="submit"
        disabled={isDisabled}
        aria-busy={busy ? true : undefined}
        className={cls}
        aria-label={t("order_copySummary")}
      >
        {done ? t("order_copySummaryDone") : t("order_copySummary")}
      </button>
    </form>
  );
}
