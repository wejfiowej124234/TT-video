"use client";

import Link from "next/link";
import { GOV_PARAMS_L5 } from "@/lib/governance/governanceParamsPageL5";
import { GOV_PARAMS_LAYOUT } from "@/lib/governance/governanceParamsPageL5Layout";

export function GovernanceParamsWeb3RuntimeStrip({
  t,
  className = "",
}: {
  t: (key: string) => string;
  className?: string;
}) {
  return (
    <div
      className={`${GOV_PARAMS_LAYOUT.blockDivider} rounded-[var(--radius-md)] border border-emerald-500/25 bg-emerald-950/20 px-4 py-3 ${className}`.trim()}
      data-tt-governance-params-web3-runtime="1"
      role="status"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300/90">
        {t("governance_params_web3_runtime_kicker")}
      </p>
      <p className={`mt-1.5 text-small leading-relaxed text-slate-200`}>{t("governance_params_web3_runtime_body")}</p>
      <nav className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-small" aria-label={t("governance_params_web3_runtime_nav_aria")}>
        <Link href="/governance/vacancy-ledger" className={GOV_PARAMS_L5.inlineLink}>
          {t("governance_params_web3_runtime_vacancy_link")}
        </Link>
        <Link href="/governance" className={GOV_PARAMS_L5.inlineLink}>
          {t("governance_params_web3_runtime_hub_link")}
        </Link>
        <Link href="/governance/fee-routes" className={GOV_PARAMS_L5.inlineLink}>
          {t("governance_params_web3_runtime_fee_routes_link")}
        </Link>
      </nav>
    </div>
  );
}
