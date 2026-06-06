"use client";

import { computePayDeadlineLines } from "@/lib/payOrderDeadlineHints";
import { payHubDeadlinePanelClass, payHubDeadlineTextClass } from "@/lib/pay/payHubL5";
import type { PayPageViewModel } from "./usePayPage";

export function PayPagePrimaryCardDeadlinePanel({ vm }: { vm: PayPageViewModel }) {
  const { payDeadlineHints, t } = vm;
  const block = computePayDeadlineLines(payDeadlineHints, t);
  if (!block) return null;
  return (
    <div className={`mt-6 ${payHubDeadlinePanelClass}`} role="status" aria-label={block.ariaLabel}>
      {block.lines.map((line, i) => (
        <p key={i} className={payHubDeadlineTextClass}>
          {line}
        </p>
      ))}
    </div>
  );
}
