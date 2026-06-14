"use client";

import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminOpsRiskBanner } from "@/components/admin/ops/AdminOpsRiskBanner";

const LINE_B_STEPS = [
  "b417-env-gap-check.sh",
  "runtime-chain-ssot-cast-verify.sh",
  "b417-list-proposal-states.sh",
  "b417-sepolia-preflight.sh",
  "b417-run-onchain-evidence.sh",
  "b417-evidence-pack-verify.sh",
] as const;

const EVIDENCE_RUNS = [
  "run_20260417T0810Z",
  "run_20260416T0602Z",
  "run_20260417T0640Z_b417",
] as const;

export function AdminGovernanceExecutionUatPageMain() {
  const { t } = useTranslation();
  const titleId = useId();

  return (
    <AdminDetailPageChrome
      titleId={titleId}
      title={t("admin_governance_execution_uat_title")}
      subtitle={t("admin_governance_execution_uat_subtitle")}
    >
      <AdminOpsRiskBanner messageKey="admin_ops_risk_banner_governance_uat" variant="info" />
      <section className="mb-6" data-tt-admin-governance-execution-uat-steps="1">
        <h2 className="text-body-m font-medium">{t("admin_governance_execution_uat_line_b_title")}</h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-body-s">
          {LINE_B_STEPS.map((step) => (
            <li key={step}>
              <code>{step}</code>
            </li>
          ))}
        </ol>
      </section>

      <section data-tt-admin-governance-execution-uat-evidence="1">
        <h2 className="text-body-m font-medium">{t("admin_governance_execution_uat_evidence_title")}</h2>
        <p className="mt-2 text-body-s text-ink-600">{t("admin_governance_execution_uat_evidence_hint")}</p>
        <ul className="mt-3 space-y-1 text-body-s font-mono">
          {EVIDENCE_RUNS.map((run) => (
            <li key={run}>evidence/b417_governance_execution_runs/{run}/</li>
          ))}
        </ul>
      </section>
    </AdminDetailPageChrome>
  );
}
