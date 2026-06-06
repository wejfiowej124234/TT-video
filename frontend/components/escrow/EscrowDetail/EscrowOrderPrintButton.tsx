"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { escrowExperienceGhostButtonClass } from "@/lib/escrowExperienceUi";
import { escrowProtocolFooterActionClass } from "@/lib/escrowProtocolUi";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2Classes,
} from "@/lib/travelLinkFocus";

const protocolDidButtonClass = escrowProtocolFooterActionClass;

const consoleButtonClass = `${touchTargetLink44Classes} inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-ink-300 bg-bg-console px-4 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 motion-sub print:hidden ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`;

/** 53-S15：`order_printPage` 与 e2e `getByRole('button', { name: /打印|Print/i })` 对齐 */
export default function EscrowOrderPrintButton({
  variant = "protocolDid",
}: {
  variant?: "protocolDid" | "console" | "experience";
}) {
  const { t } = useTranslation();
  const cls =
    variant === "experience"
      ? `${escrowExperienceGhostButtonClass} motion-sub print:hidden`
      : variant === "protocolDid"
        ? protocolDidButtonClass
        : consoleButtonClass;
  return (
    <form
      className="inline"
      onSubmit={(e) => {
        e.preventDefault();
        if (typeof window !== "undefined") window.print();
      }}
    >
      <button type="submit" className={cls} aria-label={t("order_printPage")}>
        {t("order_printPage")}
      </button>
    </form>
  );
}
