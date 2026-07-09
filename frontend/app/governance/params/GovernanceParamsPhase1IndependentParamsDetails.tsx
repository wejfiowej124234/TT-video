"use client";

import { GOV_PARAMS_L5 } from "@/lib/governance/governanceParamsPageL5";

export function GovernanceParamsPhase1IndependentParamsDetails({
  t,
  locale: _locale,
}: {
  t: (key: string) => string;
  locale: string;
}) {
  return (
    <details
      className={`mt-5 ${GOV_PARAMS_L5.accordion}`}
      data-tt-governance-params-phase1-independent-params="1"
    >
      <summary className={GOV_PARAMS_L5.accordionSummary}>{t("governance_params_phase1_independent_toggle")}</summary>
      <div className={`border-t border-white/10 px-4 pb-4 pt-3 ${GOV_PARAMS_L5.metaNote}`}>
        <p>{t("governance_params_phase1_independent_lead")}</p>
        <p className="mt-3" role="note">
          {t("governance_params_phase1_independent_formula_deprecated_note")}
        </p>
      </div>
    </details>
  );
}
