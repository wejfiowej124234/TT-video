"use client";

import type { OrderReviewWeightBreakdown } from "@/lib/apiClient";
import type { LocaleInterpolationVars } from "@/lib/i18n";
import { reviewBlockBreakdownSummaryClass, reviewBlockSubmitBreakdownShellClass } from "./reviewBlockChrome";

type TFn = (key: string, vars?: LocaleInterpolationVars) => string;

export function ReviewBlockSubmitBreakdownPanel({
  lastBreakdown,
  isDid,
  t,
}: {
  lastBreakdown: OrderReviewWeightBreakdown;
  isDid: boolean;
  t: TFn;
}) {
  const breakdownSummaryClass = reviewBlockBreakdownSummaryClass(isDid);
  const shellClass = reviewBlockSubmitBreakdownShellClass(isDid);

  return (
    <details className={shellClass} open>
      <summary className={breakdownSummaryClass}>{t("escrow_reviewSubmitBreakdownTitle")}</summary>
      <dl className="mt-2 grid gap-1 font-mono text-meta sm:grid-cols-2">
        <div>
          <dt className="text-ink-500">{t("escrow_reviewBreakdownRuleVersion")}</dt>
          <dd>{lastBreakdown.rule_version}</dd>
        </div>
        <div>
          <dt className="text-ink-500">{t("escrow_reviewBreakdownWeight")}</dt>
          <dd>{lastBreakdown.weight.toFixed(4)}</dd>
        </div>
        <div>
          <dt className="text-ink-500">{t("escrow_reviewBreakdownAmount")}</dt>
          <dd>{lastBreakdown.order_amount}</dd>
        </div>
        <div>
          <dt className="text-ink-500">{t("escrow_reviewBreakdownAge")}</dt>
          <dd>{lastBreakdown.account_age_days}</dd>
        </div>
        <div>
          <dt className="text-ink-500">{t("escrow_reviewBreakdownAmountFactor")}</dt>
          <dd>{lastBreakdown.amount_factor.toFixed(4)}</dd>
        </div>
        <div>
          <dt className="text-ink-500">{t("escrow_reviewBreakdownAgeFactor")}</dt>
          <dd>{lastBreakdown.age_factor.toFixed(4)}</dd>
        </div>
      </dl>
    </details>
  );
}
