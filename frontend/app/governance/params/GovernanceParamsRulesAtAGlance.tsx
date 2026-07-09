"use client";

import { GOV_PARAMS_L5 } from "@/lib/governance/governanceParamsPageL5";
import { GOV_PARAMS_LAYOUT } from "@/lib/governance/governanceParamsPageL5Layout";

export function GovernanceParamsRulesAtAGlance({
  t,
  className = "",
}: {
  t: (key: string) => string;
  className?: string;
}) {
  const steps = [
    {
      n: 1,
      kicker: "governance_params_glance_step1_kicker",
      label: "governance_params_glance_step1_label",
      body: "governance_params_glance_step1_body",
    },
    {
      n: 2,
      kicker: "governance_params_glance_step2_kicker",
      label: "governance_params_glance_step2_label",
      body: "governance_params_glance_step2_value",
    },
    {
      n: 3,
      kicker: "governance_params_glance_step3_kicker",
      label: "governance_params_glance_step3_label",
      body: "governance_params_glance_step3_value",
    },
  ] as const;

  return (
    <section className={className} data-tt-governance-params-rules-glance="1" aria-label={t("governance_params_overview_steps_aria")}>
      <p className={GOV_PARAMS_LAYOUT.blockKicker}>{t("governance_params_overview_steps_kicker")}</p>
      <h3 className={`mt-1 ${GOV_PARAMS_LAYOUT.blockTitle}`}>{t("governance_params_overview_steps_title")}</h3>
      <ol className="mt-4 grid gap-3 lg:grid-cols-3">
        {steps.map((step) => (
          <li
            key={step.n}
            className={`flex gap-3 rounded-[var(--radius-md)] border border-white/10 bg-slate-950/50 p-4 ${GOV_PARAMS_L5.cardHint}`}
          >
            <span className={GOV_PARAMS_LAYOUT.stepBadge} aria-hidden>
              {step.n}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-ref-sun/80">{t(step.kicker)}</p>
              <p className="mt-1 text-body font-semibold text-slate-50">{t(step.label)}</p>
              <p className={`mt-1.5 text-small leading-relaxed text-slate-300`}>{t(step.body)}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
